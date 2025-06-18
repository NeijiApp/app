// Script pour inspecter l'état actuel de la base de données
// À copier-coller dans la console du navigateur sur /protected/chat

async function inspectDatabase() {
  console.log('🔍 === INSPECTION BASE DE DONNÉES ===');
  
  try {
    const { createClient } = await import('./src/utils/supabase/client.js');
    const supabase = createClient();
    
    // 1. Vérifier l'utilisateur connecté
    console.log('👤 Vérification utilisateur...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ Pas d\'utilisateur connecté');
      return;
    }
    console.log('✅ Utilisateur:', user.email);
    
    // 2. Trouver l'ID dans users_table
    console.log('🔍 Recherche dans users_table...');
    const { data: userData } = await supabase
      .from('users_table')
      .select('id')
      .eq('email', user.email)
      .single();
    
    if (!userData) {
      console.log('❌ Utilisateur non trouvé dans users_table');
      return;
    }
    console.log('✅ User ID:', userData.id);
    
    // 3. Voir tous les messages de cet utilisateur
    console.log('📚 Messages dans la base...');
    const { data: messages } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: true });
    
    console.log('📊 Nombre total de messages:', messages?.length || 0);
    
    if (messages && messages.length > 0) {
      console.log('📝 Détail des messages:');
      messages.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.message_role}] ${msg.message_content.substring(0, 100)}${msg.message_content.length > 100 ? '...' : ''}`);
      });
      
      // Grouper par contenu pour détecter les doublons
      const grouped = messages.reduce((acc, msg) => {
        const content = msg.message_content;
        if (!acc[content]) acc[content] = [];
        acc[content].push(msg);
        return acc;
      }, {});
      
      const duplicates = Object.entries(grouped).filter(([content, msgs]) => msgs.length > 1);
      if (duplicates.length > 0) {
        console.log('🚨 DOUBLONS DÉTECTÉS:');
        duplicates.forEach(([content, msgs]) => {
          console.log(`"${content.substring(0, 50)}..." - ${msgs.length} occurrences`);
        });
      } else {
        console.log('✅ Pas de doublons détectés');
      }
    }
    
    console.log('✅ === INSPECTION TERMINÉE ===');
    
  } catch (error) {
    console.error('💥 Erreur:', error);
  }
}

// Auto-run
inspectDatabase();
