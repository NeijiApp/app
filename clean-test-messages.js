// Script de nettoyage pour supprimer les messages en double et de test
// À exécuter avec: node clean-test-messages.js

async function cleanDuplicateMessages() {
  console.log('🧹 Nettoyage des messages dupliqués...');
  
  try {
    // Note: Dans un navigateur, copiez ce code dans la console sur /protected/chat
    if (typeof window !== 'undefined') {
      console.log('📋 Script à exécuter dans la console du navigateur:');
      console.log(`
async function cleanDuplicatesInBrowser() {
  const { createClient } = await import('./src/utils/supabase/client.js');
  const supabase = createClient();
  
  // Supprimer TOUS les messages (reset complet)
  const { error } = await supabase
    .from('conversation_history')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Condition qui match tous les messages
  
  if (error) {
    console.error('❌ Erreur:', error);
  } else {
    console.log('✅ Tous les messages supprimés !');
  }
}

cleanDuplicatesInBrowser();
      `);
      return;
    }
    
    // Code Node.js (nécessite les variables d'environnement)
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables d\'environnement Supabase manquantes');
      console.log('🔧 Utilisez plutôt le script dans la console du navigateur');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Supprimer tous les messages
    const { data, error } = await supabase
      .from('conversation_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    } else {
      console.log('✅ Messages supprimés:', data);
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error);
  }
}

if (require.main === module) {
  cleanDuplicateMessages();
}

module.exports = { cleanDuplicateMessages };
