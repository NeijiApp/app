import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * 🎯 SYSTÈME DE DATABASE AVEC OPTION ROBUSTE
 * Cache la connexion database en développement et permet l'utilisation du système robuste.
 */

const globalForDb = globalThis as unknown as {
	conn: postgres.Sql | undefined;
	robustDb: any | undefined;
};

// Option pour utiliser le système robuste (activable via env)
if (process.env.USE_ROBUST_DB === "true") {
	console.log("🎯 Utilisation du système database robuste");
	
	// Import dynamique pour éviter les erreurs si le fichier n'existe pas encore
	try {
		const { createRobustDb } = await import("~/lib/meditation/database-connection-robust");
		
		// Cache la connexion robuste globalement
		if (!globalForDb.robustDb) {
			globalForDb.robustDb = createRobustDb();
		}
		
		export const db = await globalForDb.robustDb;
	} catch (error) {
		console.warn("⚠️ Système robuste indisponible, fallback vers système standard");
		// Fallback vers système standard
		const conn = globalForDb.conn ?? postgres(env.DATABASE_URL, { prepare: false });
		if (env.NODE_ENV !== "production") globalForDb.conn = conn;
		export const db = drizzle(conn, { schema });
	}
} else {
	// Système standard (par défaut)
	console.log("📊 Utilisation du système database standard");
	
	const conn = globalForDb.conn ?? postgres(env.DATABASE_URL, { prepare: false });
	if (env.NODE_ENV !== "production") globalForDb.conn = conn;
	
	export const db = drizzle(conn, { schema });
}
