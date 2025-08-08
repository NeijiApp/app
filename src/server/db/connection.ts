/**
 * 🎯 GESTIONNAIRE DE CONNEXION DATABASE COMPATIBLE BUILD
 * Version alternative qui évite les problèmes d'await top-level
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache global pour les connexions
 */
const globalForDb = globalThis as unknown as {
	conn: postgres.Sql | undefined;
	dbInstance: any | undefined;
	isInitialized: boolean;
};

/**
 * Initialise la connexion database de manière synchrone
 */
function initializeDatabaseConnection() {
	if (globalForDb.isInitialized && globalForDb.dbInstance) {
		return globalForDb.dbInstance;
	}

	try {
		// Connexion standard PostgreSQL
		const conn = globalForDb.conn ?? postgres(env.DATABASE_URL, { 
			prepare: false,
			// Paramètres optimisés pour éviter XX000
			max: 10,
			idle_timeout: 20,
			connect_timeout: 30,
		});
		
		if (env.NODE_ENV !== "production") {
			globalForDb.conn = conn;
		}

		const dbInstance = drizzle(conn, { schema });
		globalForDb.dbInstance = dbInstance;
		globalForDb.isInitialized = true;

		console.log("📊 Connexion database standard initialisée");
		return dbInstance;
	} catch (error) {
		console.error("❌ Erreur initialisation database:", error);
		throw error;
	}
}

/**
 * Connexion database robuste avec retry
 * NOTE: Robust mode disabled to prevent SASL_SIGNATURE_MISMATCH errors
 */
async function createRobustConnection() {
	// 🚫 ROBUST MODE DISABLED - using standard connection only
	// The standard connection works perfectly with prepare: false
	// Robust mode was causing SASL errors due to URL manipulation
	console.log("🎯 Using standard connection (robust mode disabled for stability)");
	
	// Always use standard connection
	return initializeDatabaseConnection();
}

/**
 * Obtient l'instance database (version async pour les cas avancés)
 */
export async function getDatabaseAsync() {
	return await createRobustConnection();
}

/**
 * Export de l'instance database standard (synchrone, compatible build)
 */
export const db = initializeDatabaseConnection();