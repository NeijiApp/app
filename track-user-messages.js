// Test spécifique pour traquer les messages utilisateur
// À copier-coller dans la console du navigateur sur /protected/chat

window.trackUserMessages = true;

// Intercepter les appels de sauvegarde
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  const options = args[1];
  
  if (typeof url === 'string' && url.includes('conversation_history')) {
    console.log('🚨 [INTERCEPT] Appel Supabase détecté!');
    console.log('🚨 [INTERCEPT] URL:', url);
    
    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        console.log('🚨 [INTERCEPT] Body:', body);
        
        if (body.message_role === 'user') {
          console.log('👤 [INTERCEPT] *** MESSAGE UTILISATEUR INTERCEPTÉ ***');
          console.log('👤 [INTERCEPT] Contenu:', body.message_content);
        }
      } catch (e) {
        console.log('🚨 [INTERCEPT] Body (raw):', options.body);
      }
    }
  }
  
  return originalFetch.apply(this, args);
};

console.log('🕵️ Intercepteur activé pour traquer les messages utilisateur');
console.log('👤 Tapez un message utilisateur et regardez les logs...');
