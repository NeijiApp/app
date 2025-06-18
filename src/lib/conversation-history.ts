import { createClient } from "~/utils/supabase/client";

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
}

export class ConversationHistory {
  private supabase = createClient();
  /**
   * Sauvegarde un message dans l'historique
   */
  async saveMessage(
    userId: number,
    message: ConversationMessage,
    retryCount = 0
  ): Promise<void> {
    console.log(`💾 [SERVICE] Sauvegarde message - userId: ${userId}, messageId: ${message.id}, role: ${message.role}, retry: ${retryCount}`);
    
    try {
      console.log('📝 [SERVICE] Insertion en BDD...');
      const { error } = await this.supabase
        .from('conversation_history')
        .insert({
          user_id: userId,
          message_content: message.content,
          message_role: message.role,
          audio_url: message.audioUrl || null,
        });

      if (error) {
        console.error('❌ [SERVICE] Erreur Supabase:', error);
        throw error;
      } else {
        console.log('✅ [SERVICE] Message sauvegardé avec succès');
      }
    } catch (error) {
      console.error('💥 [SERVICE] Erreur sauvegarde message:', error);
      
      // Retry automatique (max 3 fois)
      if (retryCount < 3) {
        console.log(`🔄 [SERVICE] Retry sauvegarde message (tentative ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Délai croissant
        return this.saveMessage(userId, message, retryCount + 1);
      } else {
        console.error('💀 [SERVICE] Échec définitif de la sauvegarde après 3 tentatives');
        // Le chat continue de fonctionner même si la sauvegarde échoue
      }
    }
  }
  /**
   * Récupère l'historique des conversations d'un utilisateur
   */
  async getHistory(userId: number, limit = 100): Promise<ConversationMessage[]> {
    console.log(`📚 [SERVICE] Récupération historique - userId: ${userId}, limit: ${limit}`);
    
    try {
      console.log('🔍 [SERVICE] Requête Supabase...');
      const { data, error } = await this.supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ [SERVICE] Erreur Supabase getHistory:', error);
        throw error;
      }

      console.log(`📋 [SERVICE] Données récupérées:`, data?.length || 0, 'enregistrements');
      
      const messages = (data || []).map(record => ({
        id: record.id.toString(),
        role: record.message_role as 'user' | 'assistant',
        content: record.message_content,
        audioUrl: record.audio_url || undefined,
      }));
      
      console.log(`✅ [SERVICE] Messages transformés:`, messages.length);
      return messages;
    } catch (error) {
      console.error('💥 [SERVICE] Erreur récupération historique:', error);
      return []; // Retourne un tableau vide en cas d'erreur
    }
  }  /**
   * Récupère l'ID de l'utilisateur connecté
   */
  async getCurrentUserId(): Promise<number | null> {
    console.log('👤 [SERVICE] Récupération userId...');
    
    try {
      console.log('🔐 [SERVICE] Vérification auth user...');
      
      // Ajout d'un timeout pour éviter le blocage infini
      const authPromise = this.supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout auth getUser')), 5000)
      );
      
      const { data: { user }, error: authError } = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as any;
      
      if (authError) {
        console.error('❌ [SERVICE] Erreur auth:', authError);
        return null;
      }
      
      if (!user) {
        console.log('❌ [SERVICE] Pas d\'utilisateur connecté');
        return null;
      }
      
      console.log('✅ [SERVICE] User trouvé:', user.email);

      console.log('🔍 [SERVICE] Recherche dans users_table...');
      
      // Timeout pour la requête users_table aussi
      const usersTablePromise = this.supabase
        .from('users_table')
        .select('id')
        .eq('email', user.email)
        .single();
        
      const usersTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout users_table')), 5000)
      );
      
      const { data, error } = await Promise.race([
        usersTablePromise,
        usersTimeoutPromise
      ]) as any;

      if (error) {
        console.error('❌ [SERVICE] Erreur recherche user:', error);
        return null;
      }
      
      if (!data) {
        console.log('❌ [SERVICE] User non trouvé dans users_table');
        return null;
      }

      console.log('✅ [SERVICE] UserId trouvé:', data.id);
      return data.id;
    } catch (error) {
      console.error('💥 [SERVICE] Erreur récupération user ID:', error);
      return null;
    }
  }
}

// Instance singleton
export const conversationHistory = new ConversationHistory();
