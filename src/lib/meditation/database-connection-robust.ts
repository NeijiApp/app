/**
 * 🔧 CONFIGURATION ROBUSTE DE CONNEXION DATABASE
 * Solution permanente pour erreur XX000 Supabase pooler
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import * as schema from "~/server/db/schema";

/**
 * Configuration de connexion robuste avec fallbacks
 */
class RobustDatabaseConnection {
  private static instance: RobustDatabaseConnection;
  private primaryConnection: postgres.Sql | null = null;
  private fallbackConnection: postgres.Sql | null = null;
  private currentConnection: postgres.Sql | null = null;
  private connectionAttempts = 0;
  private maxRetries = 3;

  static getInstance(): RobustDatabaseConnection {
    if (!RobustDatabaseConnection.instance) {
      RobustDatabaseConnection.instance = new RobustDatabaseConnection();
    }
    return RobustDatabaseConnection.instance;
  }

  /**
   * Crée une connexion avec fallbacks automatiques
   */
  async getConnection(): Promise<postgres.Sql> {
    if (this.currentConnection) {
      return this.currentConnection;
    }

    // 1. Essayer connexion pooler principale
    try {
      this.primaryConnection = await this.createPrimaryConnection();
      await this.testConnection(this.primaryConnection);
      
      console.log("✅ Connexion pooler principale réussie");
      this.currentConnection = this.primaryConnection;
      this.connectionAttempts = 0;
      return this.currentConnection;
    } catch (error) {
      console.warn("⚠️ Échec connexion pooler principale:", error);
      this.connectionAttempts++;
    }

    // 2. Fallback: connexion directe
    try {
      this.fallbackConnection = await this.createFallbackConnection();
      await this.testConnection(this.fallbackConnection);
      
      console.log("✅ Connexion directe fallback réussie");
      this.currentConnection = this.fallbackConnection;
      return this.currentConnection;
    } catch (error) {
      console.error("❌ Échec toutes les connexions:", error);
      throw new Error(`Impossible de se connecter à la base de données après ${this.connectionAttempts} tentatives`);
    }
  }

  /**
   * Connexion pooler principale (Supavisor)
   */
  private async createPrimaryConnection(): Promise<postgres.Sql> {
    // Format Supavisor: postgres://postgres.PROJECT_REF:PASSWORD@region.pooler.supabase.com:6543/postgres
    const poolerUrl = this.buildSupavisorUrl();
    
    return postgres(poolerUrl, {
      prepare: false,
      ssl: "require",
      max: 20,
      idle_timeout: 30,
      connect_timeout: 15,
      connection: {
        application_name: "neiji-meditation-app",
      },
      // Paramètres optimisés pour Supavisor
      transform: postgres.camel,
      debug: env.NODE_ENV === "development",
    });
  }

  /**
   * Connexion directe en fallback
   */
  private async createFallbackConnection(): Promise<postgres.Sql> {
    // Connexion directe sans pooler
    const directUrl = this.buildDirectUrl();
    
    return postgres(directUrl, {
      prepare: false,
      ssl: "require",
      max: 10, // Moins de connexions pour direct
      idle_timeout: 20,
      connect_timeout: 30,
      connection: {
        application_name: "neiji-meditation-app-direct",
      },
    });
  }

  /**
   * Construit l'URL Supavisor avec format correct
   */
  private buildSupavisorUrl(): string {
    const originalUrl = env.DATABASE_URL;
    
    // Extraire les composants
    const url = new URL(originalUrl);
    const password = url.password;
    const host = url.hostname;
    
    // Détecter le PROJECT_REF depuis l'hostname
    const projectRef = this.extractProjectRef(host);
    
    // Format Supavisor correct
    return `postgresql://postgres.${projectRef}:${password}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
  }

  /**
   * Construit l'URL de connexion directe
   */
  private buildDirectUrl(): string {
    const originalUrl = env.DATABASE_URL;
    const url = new URL(originalUrl);
    
    // Remplacer par connexion directe
    url.hostname = url.hostname.replace('pooler.supabase.com', 'supabase.co').replace('aws-0-us-west-1.', 'db.');
    url.port = '5432';
    
    return url.toString();
  }

  /**
   * Extrait le PROJECT_REF de l'hostname
   */
  private extractProjectRef(hostname: string): string {
    // Format: db.XXXXXXXX.supabase.co ou aws-0-us-west-1.pooler.supabase.com
    if (hostname.includes('supabase.co')) {
      const match = hostname.match(/db\.([a-zA-Z0-9]+)\.supabase\.co/);
      return match?.[1] || 'unknown';
    }
    
    // Si pas trouvé, utiliser une partie de l'URL originale
    return env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'unknown';
  }

  /**
   * Teste une connexion
   */
  private async testConnection(conn: postgres.Sql): Promise<void> {
    const result = await conn`SELECT version() as version`;
    if (!result[0]?.version) {
      throw new Error("Test de connexion échoué");
    }
  }

  /**
   * Force la reconnexion
   */
  async reconnect(): Promise<postgres.Sql> {
    if (this.currentConnection) {
      try {
        await this.currentConnection.end();
      } catch (error) {
        console.warn("⚠️ Erreur fermeture connexion:", error);
      }
    }
    
    this.currentConnection = null;
    this.primaryConnection = null;
    this.fallbackConnection = null;
    
    return this.getConnection();
  }

  /**
   * Informations de diagnostic
   */
  getDiagnostics(): {
    currentConnectionType: 'pooler' | 'direct' | 'none';
    connectionAttempts: number;
    isConnected: boolean;
  } {
    let currentConnectionType: 'pooler' | 'direct' | 'none' = 'none';
    
    if (this.currentConnection === this.primaryConnection) {
      currentConnectionType = 'pooler';
    } else if (this.currentConnection === this.fallbackConnection) {
      currentConnectionType = 'direct';
    }

    return {
      currentConnectionType,
      connectionAttempts: this.connectionAttempts,
      isConnected: !!this.currentConnection,
    };
  }
}

// Instance singleton
const robustDb = RobustDatabaseConnection.getInstance();

/**
 * Connexion Drizzle avec gestion d'erreur automatique
 */
export const createRobustDb = async () => {
  try {
    const conn = await robustDb.getConnection();
    return drizzle(conn, { schema });
  } catch (error) {
    console.error("❌ Erreur création DB robuste:", error);
    
    // Essayer reconnexion
    try {
      const conn = await robustDb.reconnect();
      return drizzle(conn, { schema });
    } catch (retryError) {
      console.error("❌ Échec reconnexion:", retryError);
      throw new Error("Base de données indisponible");
    }
  }
};

/**
 * Middleware pour retry automatique
 */
export const withDatabaseRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`⚠️ Tentative ${attempt}/${maxRetries} échouée:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Reconnexion entre les tentatives
      if (attempt < maxRetries) {
        await robustDb.reconnect();
        // Pause exponentielle
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw new Error("Toutes les tentatives ont échoué");
};

// Export de l'instance pour diagnostics
export { robustDb };