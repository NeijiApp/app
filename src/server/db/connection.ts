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
 */
async function createRobustConnection() {
	// Si le système robuste est disponible
	if (process.env.USE_ROBUST_DB === "true") {
		try {
			console.log("🎯 Chargement du système database robuste...");
			const { createRobustDb } = await import("~/lib/meditation/database-connection-robust");
			const robustDb = await createRobustDb();
			console.log("✅ Système database robuste activé");
			return robustDb;
		} catch (error) {
			console.warn("⚠️ Système robuste indisponible, utilisation standard:", error);
		}
	}

	// Fallback vers connexion standard
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