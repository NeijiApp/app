/**
 * Quick Environment Variable Check
 * Shows exactly what DATABASE_URL the app is reading
 */

import { env } from "~/env.js";

console.log("🔍 Environment Variable Check");
console.log("=" .repeat(40));

const dbUrl = env.DATABASE_URL;
console.log("DATABASE_URL exists:", !!dbUrl);

if (dbUrl) {
    try {
        const url = new URL(dbUrl);
        console.log("📋 Host:", url.hostname);
        console.log("📋 Port:", url.port);
        console.log("📋 Database:", url.pathname.substring(1));
        console.log("📋 User:", url.username);
        console.log("📋 Has password:", !!url.password);
        console.log("📋 Search params:", url.search);
        
        // Check if it's the pooler
        if (url.hostname.includes("pooler")) {
            console.log("✅ Using POOLER connection");
        } else if (url.hostname.includes("db.")) {
            console.log("⚠️ Using DIRECT connection");
        } else {
            console.log("❓ Unknown connection type");
        }
        
        // Check port
        if (url.port === "6543") {
            console.log("✅ Using pooler port (6543)");
        } else if (url.port === "5432") {
            console.log("⚠️ Using direct port (5432)");
        } else {
            console.log("❓ Unknown port:", url.port);
        }
        
    } catch (error) {
        console.error("❌ Invalid DATABASE_URL format:", error);
    }
} else {
    console.error("❌ DATABASE_URL not found");
}

console.log("=" .repeat(40));
