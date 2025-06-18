// Test du service conversation-history
import { conversationHistory } from './src/lib/conversation-history.js';

async function testConversationHistory() {
  console.log('🧪 Test du service conversation-history...');
  
  try {
    // Test de getCurrentUserId (devrait échouer sans session)
    console.log('📋 Test getCurrentUserId...');
    const userId = await conversationHistory.getCurrentUserId();
    console.log('✅ User ID:', userId);
  } catch (error) {
    console.log('❌ getCurrentUserId (attendu sans session):', String(error));
  }
  
  // Test saveMessage et getHistory seraient plus complexes car ils nécessitent une vraie session
  console.log('ℹ️  Pour tester saveMessage et getHistory, il faut une session utilisateur authentifiée');
  console.log('✅ Service conversation-history importé avec succès');
}

testConversationHistory().catch(console.error);
