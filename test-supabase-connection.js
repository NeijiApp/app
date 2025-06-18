// Script de test Supabase - à exécuter dans la console du navigateur
// Testez ceci sur la page /protected/chat

async function testSupabaseConnection() {
  console.log('🧪 === TEST CONNEXION SUPABASE ===');
  
  try {
    // Import du client Supabase
    const { createClient } = await import('/node_modules/@supabase/supabase-js/dist/main.js');
    
    // Variables d'environnement (remplacez par vos vraies valeurs)
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
    
    console.log('🔧 URL Supabase:', SUPABASE_URL);
    console.log('🔑 Anon Key:', SUPABASE_ANON_KEY?.substring(0, 10) + '...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test 1: Vérifier la connexion de base
    console.log('🌐 Test connexion de base...');
    const { data: tables, error: tablesError } = await supabase.rpc('version');
    if (tablesError) {
      console.log('❌ Erreur connexion:', tablesError);
    } else {
      console.log('✅ Connexion Supabase OK');
    }
    
    // Test 2: Vérifier l'auth
    console.log('🔐 Test auth...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('❌ Erreur auth:', authError);
    } else {
      console.log('✅ Auth data:', authData);
    }
    
    // Test 3: Vérifier les tables
    console.log('📋 Test accès aux tables...');
    const { data: users, error: usersError } = await supabase
      .from('users_table')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Erreur users_table:', usersError);
    } else {
      console.log('✅ users_table accessible:', users);
    }
    
    const { data: conversations, error: convError } = await supabase
      .from('conversation_history')
      .select('*')
      .limit(1);
    
    if (convError) {
      console.log('❌ Erreur conversation_history:', convError);
    } else {
      console.log('✅ conversation_history accessible:', conversations);
    }
    
    console.log('✅ === TEST TERMINÉ ===');
    
  } catch (error) {
    console.error('💥 Erreur durant le test:', error);
  }
}

// Auto-run
testSupabaseConnection();
