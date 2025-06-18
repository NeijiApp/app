// Script à copier-coller dans la console du navigateur pour debug
// Testez ceci sur la page /protected/chat

async function debugConversationHistory() {
  console.log('🧪 === TEST DEBUG CONVERSATION HISTORY ===');
  
  try {
    // Test 1: Importer le service
    console.log('📦 Import du service...');
    const module = await import('./src/lib/conversation-history.js');
    const conversationHistory = module.conversationHistory;
    
    // Test 2: Vérifier l'utilisateur connecté
    console.log('👤 Test utilisateur connecté...');
    const userId = await conversationHistory.getCurrentUserId();
    console.log('👤 UserId:', userId);
    
    if (!userId) {
      console.error('❌ Pas d\'utilisateur connecté - assurez-vous d\'être sur /protected/chat');
      return;
    }
    
    // Test 3: Récupérer l'historique
    console.log('📚 Test récupération historique...');
    const history = await conversationHistory.getHistory(userId);
    console.log('📚 Historique récupéré:', history);
    
    // Test 4: Sauvegarder un message de test
    console.log('💾 Test sauvegarde message...');
    const testMessage = {
      id: `test-${Date.now()}`,
      role: 'user',
      content: `Message de test - ${new Date().toISOString()}`,
    };
    
    await conversationHistory.saveMessage(userId, testMessage);
    console.log('✅ Message de test sauvegardé');
    
    // Test 5: Vérifier que le message a bien été sauvegardé
    console.log('🔍 Vérification sauvegarde...');
    const newHistory = await conversationHistory.getHistory(userId);
    console.log('📊 Nouvel historique:', newHistory);
    
    console.log('✅ === TEST TERMINÉ AVEC SUCCÈS ===');
    
  } catch (error) {
    console.error('💥 Erreur durant le test:', error);
  }
}

// Auto-run si on est dans le bon contexte
if (typeof window !== 'undefined' && window.location.pathname.includes('/protected/chat')) {
  console.log('🚀 Lancement auto du test debug...');
  debugConversationHistory();
} else {
  console.log('ℹ️ Pour lancer le test: debugConversationHistory()');
}
