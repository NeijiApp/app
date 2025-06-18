// Version corrigée simple du useEffect de sauvegarde
// À remplacer dans provider.tsx

// Sauvegarder automatiquement les nouveaux messages du chat
useEffect(() => {
  console.log('🔄 [PROVIDER] useEffect sauvegarde - Messages:', chat.messages.length, 'isLoadingHistory:', isLoadingHistory, 'isLoading:', chat.isLoading);
  console.log('🔄 [PROVIDER] savedMessageIds actuels:', Array.from(savedMessageIds));
  
  // NE PAS sauvegarder pendant le streaming !
  if (chat.isLoading) {
    console.log('🚫 [PROVIDER] Streaming en cours, pas de sauvegarde');
    return;
  }
  
  // NE PAS sauvegarder pendant le chargement initial
  if (isLoadingHistory) {
    console.log('⏳ [PROVIDER] Historique en cours de chargement, pas de sauvegarde');
    return;
  }
  
  if (chat.messages.length === 0) {
    console.log('📭 [PROVIDER] Pas de messages, skip');
    return;
  }
  
  const saveNewMessages = async () => {
    try {
      console.log('🔍 [PROVIDER] Récupération userId pour sauvegarde...');
      const userId = await conversationHistory.getCurrentUserId();
      console.log('👤 [PROVIDER] UserId pour sauvegarde:', userId);
      
      if (!userId) {
        console.log('⏭️ [PROVIDER] Pas d\'userId, skip sauvegarde');
        return;
      }

      // Sauvegarder seulement le dernier message s'il n'a pas déjà été sauvegardé
      const lastMessage = chat.messages[chat.messages.length - 1];
      console.log('📝 [PROVIDER] Dernier message à analyser:', {
        id: lastMessage?.id,
        role: lastMessage?.role,
        content: lastMessage?.content?.substring(0, 50) + '...'
      });
      
      if (!lastMessage) {
        console.log('⏭️ [PROVIDER] Pas de dernier message');
        return;
      }
      
      // Logs spéciaux pour les messages utilisateur
      if (lastMessage.role === 'user') {
        console.log('👤 [PROVIDER] *** MESSAGE UTILISATEUR DÉTECTÉ ***');
        console.log('👤 [PROVIDER] Contenu:', lastMessage.content);
        console.log('👤 [PROVIDER] ID:', lastMessage.id);
      }
      
      // Vérifier si ce message a déjà été sauvegardé
      const hasIdSaved = lastMessage.id.includes('saved-');
      const hasTracked = savedMessageIds.has(lastMessage.id);
      const isValidRole = lastMessage.role === 'user' || lastMessage.role === 'assistant';
      
      console.log('🔍 [PROVIDER] Vérifications:', {
        hasIdSaved,
        hasTracked,
        isValidRole,
        messageId: lastMessage.id,
        role: lastMessage.role
      });
      
      if (!hasIdSaved && !hasTracked && isValidRole) {
        console.log('💾 [PROVIDER] SAUVEGARDE du message:', lastMessage.id, lastMessage.role);
        
        // Log spécial pour user
        if (lastMessage.role === 'user') {
          console.log('👤 [PROVIDER] *** SAUVEGARDE MESSAGE UTILISATEUR ***');
        }
        
        // Marquer immédiatement comme en cours de sauvegarde pour éviter les doublons
        setSavedMessageIds(prev => {
          const newSet = new Set([...prev, lastMessage.id]);
          console.log('🏷️ [PROVIDER] Ajout à savedMessageIds:', lastMessage.id, 'Total:', newSet.size);
          if (lastMessage.role === 'user') {
            console.log('👤 [PROVIDER] *** MESSAGE USER AJOUTÉ AU TRACKING ***');
          }
          return newSet;
        });
        
        await conversationHistory.saveMessage(userId, {
          id: lastMessage.id,
          role: lastMessage.role as 'user' | 'assistant',
          content: lastMessage.content,
        });
        
        console.log('✅ [PROVIDER] Message sauvegardé avec succès');
        if (lastMessage.role === 'user') {
          console.log('👤 [PROVIDER] *** MESSAGE UTILISATEUR SAUVEGARDÉ EN BASE ***');
        }
        
        // Marquer le message comme sauvegardé dans l'ID aussi
        const updatedMessages = [...chat.messages];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          id: `saved-${lastMessage.id}`,
        };
        chat.setMessages(updatedMessages);
        console.log('🔄 [PROVIDER] Messages mis à jour avec nouvel ID');
      } else {
        console.log('⏭️ [PROVIDER] Message SKIP - hasIdSaved:', hasIdSaved, 'hasTracked:', hasTracked, 'isValidRole:', isValidRole);
        if (lastMessage.role === 'user') {
          console.log('👤 [PROVIDER] *** MESSAGE UTILISATEUR SKIPPÉ - POURQUOI? ***');
          console.log('👤 [PROVIDER] hasIdSaved:', hasIdSaved);
          console.log('👤 [PROVIDER] hasTracked:', hasTracked);
          console.log('👤 [PROVIDER] savedMessageIds contient:', Array.from(savedMessageIds));
        }
      }
    } catch (error) {
      console.error('💥 [PROVIDER] Erreur lors de la sauvegarde:', error);
    }
  };

  console.log('🚀 [PROVIDER] Lancement de la sauvegarde...');
  saveNewMessages();
}, [chat.messages, isLoadingHistory, chat.isLoading, savedMessageIds]);
