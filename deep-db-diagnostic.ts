/**
 * Deep Database Diagnostic - Finding the root cause
 */

import { env } from "~/env.js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

async function deepDiagnostic() {
    console.log("🔬 Deep Database Diagnostic");
    console.log("=" .repeat(60));
    
    // 1. Check environment loading
    console.log("\n📋 1. Environment Check");
    console.log("-" .repeat(40));
    
    const dbUrl = env.DATABASE_URL;
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseService = env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log("DATABASE_URL exists:", !!dbUrl);
    console.log("NEXT_PUBLIC_SUPABASE_URL exists:", !!supabaseUrl);
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY exists:", !!supabaseAnon);
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseService);
    
    if (!dbUrl) {
        console.error("❌ No DATABASE_URL found!");
        return;
    }
    
    // Parse URL details
    const url = new URL(dbUrl);
    console.log("\n📌 Connection Details:");
    console.log("   Host:", url.hostname);
    console.log("   Port:", url.port);
    console.log("   Database:", url.pathname.substring(1));
    console.log("   User:", url.username);
    console.log("   Password length:", url.password?.length || 0);
    
    // Check if this matches the Supabase project
    if (supabaseUrl) {
        const supaProjectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        const dbProjectId = url.username.split('.')[1];
        console.log("\n🔍 Project ID Check:");
        console.log("   Supabase URL Project ID:", supaProjectId);
        console.log("   Database URL Project ID:", dbProjectId);
        if (supaProjectId === dbProjectId) {
            console.log("   ✅ Project IDs match!");
        } else {
            console.log("   ❌ PROJECT ID MISMATCH - This could be the issue!");
        }
    }
    
    // 2. Test with Supabase Client (different approach)
    console.log("\n📋 2. Supabase Client Test");
    console.log("-" .repeat(40));
    
    if (supabaseUrl && supabaseService) {
        try {
            const supabase = createClient(supabaseUrl, supabaseService);
            const { data, error } = await supabase
                .from('audio_segments_cache')
                .select('id')
                .limit(1);
            
            if (error) {
                console.log("❌ Supabase client query failed:", error.message);
            } else {
                console.log("✅ Supabase client works! Table is accessible.");
                console.log("   This confirms your Supabase credentials are correct.");
            }
        } catch (e: any) {
            console.log("❌ Supabase client error:", e.message);
        }
    } else {
        console.log("⏭️ Skipping - missing Supabase credentials");
    }
    
    // 3. Test different connection formats
    console.log("\n📋 3. Connection Format Tests");
    console.log("-" .repeat(40));
    
    // Test A: Without any parameters
    console.log("\n🧪 Test A: Basic connection (no params)");
    try {
        const basicUrl = `postgresql://${url.username}:${url.password}@${url.hostname}:${url.port}/${url.pathname.substring(1)}`;
        const sql = postgres(basicUrl, {
            max: 1,
            connect_timeout: 5
        });
        await sql`SELECT 1`;
        console.log("✅ Basic format works!");
        await sql.end();
    } catch (e: any) {
        console.log("❌ Failed:", e.code || e.message);
    }
    
    // Test B: With pgbouncer=true
    console.log("\n🧪 Test B: With pgbouncer=true");
    try {
        const pgbouncerUrl = `${dbUrl}?pgbouncer=true`;
        const sql = postgres(pgbouncerUrl, {
            max: 1,
            connect_timeout: 5
        });
        await sql`SELECT 1`;
        console.log("✅ pgbouncer=true works!");
        await sql.end();
    } catch (e: any) {
        console.log("❌ Failed:", e.code || e.message);
    }
    
    // Test C: With prepare=false (important for poolers)
    console.log("\n🧪 Test C: With prepare=false");
    try {
        const sql = postgres(dbUrl, {
            max: 1,
            connect_timeout: 5,
            prepare: false  // Important for connection poolers!
        });
        await sql`SELECT 1`;
        console.log("✅ prepare=false works! THIS IS LIKELY THE FIX!");
        await sql.end();
    } catch (e: any) {
        console.log("❌ Failed:", e.code || e.message);
    }
    
    // 4. Check postgres library version
    console.log("\n📋 4. Library Version Check");
    console.log("-" .repeat(40));
    
    try {
        // @ts-ignore - Optional diagnostic dependency
        const pgPackage = await import("postgres/package.json") as { version: string };
        console.log("Postgres library version:", pgPackage.version);
        console.log("💡 If version is < 3.4.0, consider upgrading");
    } catch {
        console.log("Could not check postgres version - postgres package not found");
    }
    
    // 5. Test alternative connection library
    console.log("\n📋 5. Alternative Connection Test (pg library)");
    console.log("-" .repeat(40));
    
    try {
        // @ts-ignore - Optional diagnostic dependency
        const { Client } = await import("pg");
        const client = new Client({
            connectionString: dbUrl
        });
        
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log("✅ pg library works! Current time:", res.rows[0].now);
        await client.end();
    } catch (e: any) {
        console.log("❌ pg library failed:", e.message);
        console.log("   Install with: bun add pg @types/pg");
    }
    
    console.log("\n" + "=" .repeat(60));
    console.log("📊 DIAGNOSIS SUMMARY:");
    console.log("-" .repeat(40));
    console.log("🎯 Most likely solutions:");
    console.log("1. Add 'prepare: false' to postgres() options (for poolers)");
    console.log("2. Check if project IDs match between Supabase and DATABASE_URL");
    console.log("3. Try using Supabase client instead of direct postgres connection");
    console.log("4. Consider using pg library instead of postgres library");
}

deepDiagnostic()
    .then(() => {
        console.log("\n✅ Diagnostic complete");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Diagnostic failed:", error);
        process.exit(1);
    });
