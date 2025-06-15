// Test rapide de la base de données
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDB() {
  console.log('🔍 Test de la base de données...');
  
  const { data, error } = await supabase
    .from('users_table')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Erreur:', error.message);
  } else {
    console.log('✅ Connexion réussie !');
    if (data.length > 0) {
      console.log('📊 Colonnes disponibles:', Object.keys(data[0]));
    } else {
      console.log('📊 Table vide - prête pour les nouveaux utilisateurs');
    }
  }
}

testDB();
