/**
 * Quick fix to disable robust cache mode and eliminate SASL warnings
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function fixCacheMode() {
    console.log("🔧 Fixing cache mode to eliminate SASL warnings");
    
    const envPath = join(process.cwd(), '.env.local');
    
    try {
        // Read current .env.local
        let envContent = readFileSync(envPath, 'utf-8');
        
        // Check current USE_ROBUST_DB setting
        if (envContent.includes('USE_ROBUST_DB=true')) {
            console.log("📝 Found USE_ROBUST_DB=true, changing to false...");
            envContent = envContent.replace('USE_ROBUST_DB=true', 'USE_ROBUST_DB=false');
        } else if (!envContent.includes('USE_ROBUST_DB')) {
            console.log("📝 Adding USE_ROBUST_DB=false...");
            envContent += '\nUSE_ROBUST_DB=false\n';
        } else {
            console.log("✅ USE_ROBUST_DB already set to false");
            return;
        }
        
        // Write back to file
        writeFileSync(envPath, envContent);
        console.log("✅ Updated .env.local successfully!");
        console.log("🔄 Please restart your dev server to apply changes:");
        console.log("   1. Stop current server (Ctrl+C)");
        console.log("   2. Run: bun dev");
        console.log("💡 This will eliminate the SASL_SIGNATURE_MISMATCH warning");
        
    } catch (error: any) {
        console.error("❌ Error updating .env.local:", error.message);
        console.log("🔧 Manual fix: Add this line to your .env.local:");
        console.log("   USE_ROBUST_DB=false");
    }
}

fixCacheMode();
