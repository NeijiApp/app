import { env } from "~/env.js";

export async function GET() {
	// Test toutes les hypothèses communes de la recherche
	const allEnvKeys = Object.keys(process.env);

	return Response.json({
		// Test direct process.env (comme dans T3 research)
		direct_process_env: {
			ASSEMBLY_SERVICE_URL: process.env.ASSEMBLY_SERVICE_URL,
			assembly_service_url: process.env.assembly_service_url,
			ASSEMBLY_SERVICE_url: process.env.ASSEMBLY_SERVICE_url, // Test case variations
		},

		// Test via T3 env object (should use runtimeEnv)
		t3_env_object: {
			ASSEMBLY_SERVICE_URL: env.ASSEMBLY_SERVICE_URL,
		},

		// Recherche toutes les keys similaires (typos, case issues)
		similar_keys: allEnvKeys.filter(
			(key) =>
				key.toLowerCase().includes("assembly") ||
				key.toLowerCase().includes("service") ||
				key.toLowerCase().includes("railway") ||
				key.toLowerCase().includes("url"),
		),

		// Test environnement Vercel (selon la research)
		vercel_info: {
			NODE_ENV: process.env.NODE_ENV,
			VERCEL: process.env.VERCEL,
			VERCEL_ENV: process.env.VERCEL_ENV,
			VERCEL_URL: process.env.VERCEL_URL,
		},

		// Compteur total des env vars (pour détecter si elles sont stripped)
		total_env_vars: allEnvKeys.length,
		sample_env_vars: allEnvKeys.slice(0, 5), // Échantillon

		// Test autres variables qui marchent (comparaison)
		working_vars: {
			DATABASE_URL: process.env.DATABASE_URL ? "SET" : "UNDEFINED",
			OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "SET" : "UNDEFINED",
		},

		message: "Diagnostic complet basé sur la recherche T3 Env + Vercel",
	});
}
