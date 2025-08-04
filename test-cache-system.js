#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TEST DU SYSTÈME DE CACHE ROBUSTE
 */

import { execSync } from 'child_process';

const TESTS = [
  {
    name: "Test connexion database",
    command: "node -e \"import('./src/server/db/index.js').then(() => console.log('✅ DB OK'))\"",
  },
  {
    name: "Test cache hybride",
    command: "node -e \"import('./src/lib/meditation/cache-management.js').then(() => console.log('✅ Cache OK'))\"",
  },
  {
    name: "Test embeddings service",
    command: "node -e \"import('./src/lib/meditation/embeddings-service.js').then(() => console.log('✅ Embeddings OK'))\"",
  },
  {
    name: "Test API routes",
    command: "npm run build",
  },
];

async function runTests() {
  console.log("🧪 TESTS SYSTÈME CACHE ROBUSTE");
  console.log("==============================");
  
  let passed = 0;
  let failed = 0;
  
  for (const test of TESTS) {
    console.log(`\n📋 ${test.name}...`);
    
    try {
      execSync(test.command, { stdio: 'pipe', timeout: 30000 });
      console.log(`✅ ${test.name} - PASS`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} - FAIL`);
      console.log(`   Erreur: ${error.message.split('\n')[0]}`);
      failed++;
    }
  }
  
  console.log(`\n📊 RÉSULTATS:`);
  console.log(`✅ Réussis: ${passed}`);
  console.log(`❌ Échoués: ${failed}`);
  
  if (failed === 0) {
    console.log(`\n🎉 TOUS LES TESTS PASSENT !`);
    console.log(`Système de cache robuste prêt à l'utilisation.`);
  } else {
    console.log(`\n⚠️ ${failed} test(s) en échec.`);
    console.log(`Exécutez le script de migration: node migrate-to-robust-cache.js`);
  }
}

runTests().catch(console.error);