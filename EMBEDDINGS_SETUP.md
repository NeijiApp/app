# 🧠 Service Embeddings OpenAI - Guide de Configuration

## 📋 **ÉTAPE 2 : Service Embeddings OpenAI**

### **Objectif**
Implémenter un système de recherche sémantique intelligent qui :
- Génère des embeddings OpenAI pour chaque segment de texte
- Trouve des segments similaires par sens (pas seulement par mots exacts)
- Optimise le cache en évitant les doublons sémantiques
- Réduit les coûts TTS en réutilisant des segments similaires

---

## 🚀 **Configuration Requise**

### **1. Variables d'environnement**
Créez un fichier `.env.local` avec :

```bash
# OpenAI API Key (requis pour les embeddings)
OPENAI_API_KEY="sk-..."

# Base de données (déjà configurée)
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Optionnel pour les méditations
ELEVENLABS_API_KEY="sk_..."
OPENROUTER_API_KEY="sk-..."
```

### **2. Migration base de données**
Assurez-vous que la migration de l'étape 1 est appliquée :

```bash
pnpm run db:push
```

---

## 🧪 **Test du Service**

### **1. Test de base**
```bash
node test-embeddings.js
```

**Résultat attendu :**
```
🧪 Test du service d'embeddings OpenAI...

1. Vérification configuration:
   ✅ OPENAI_API_KEY: sk-proj-...
   ✅ DATABASE_URL: configurée

2. Test génération embedding:
   📝 Texte 1: "Respirez profondément et détendez-vous"
   📝 Texte 2: "Prenez une inspiration profonde et relaxez-vous"
   📝 Texte 3: "Concentrez-vous sur votre respiration"

   🔄 Génération des embeddings...
   ✅ Embedding 1: 1536 dimensions
   ✅ Embedding 2: 1536 dimensions
   ✅ Embedding 3: 1536 dimensions

   🧮 Calcul des similarités:
   📊 Similarité 1-2 (similaires): 85.23%
   📊 Similarité 1-3 (différents): 72.14%
   📊 Similarité 2-3 (différents): 71.89%
   ✅ Textes similaires correctement détectés

3. Test génération batch:
   📝 4 textes à traiter en batch
   ✅ 4 embeddings générés
   📊 Dimensions: 1536

📊 Résultats: 2/2 tests réussis
✅ Tous les tests sont passés !

🎯 Service d'embeddings prêt pour l'intégration
💡 Prochaine étape: Intégrer dans le système de cache audio
```

---

## 🛠️ **Composants Créés**

### **1. Service Embeddings** (`src/lib/meditation/embeddings-service.ts`)
- **`generateEmbedding()`** : Génère un embedding OpenAI
- **`generateEmbeddingsBatch()`** : Traitement par batch (plus efficace)
- **`calculateCosineSimilarity()`** : Calcul de similarité entre vecteurs
- **`findSimilarSegmentsByEmbedding()`** : Recherche sémantique
- **`updateMissingEmbeddings()`** : Mise à jour batch des embeddings manquants
- **`getEmbeddingsStats()`** : Statistiques du système

### **2. Cache Audio Amélioré** (`src/lib/meditation/audio-cache.ts`)
- **`findBestCachedSegment()`** : Recherche intelligente (exact + sémantique)
- **`saveAudioSegmentToCache()`** : Sauvegarde avec génération d'embedding automatique
- Intégration transparente avec l'ancien système

### **3. Tests** (`test-embeddings.js`)
- Validation de la configuration
- Test de génération d'embeddings
- Test de calcul de similarité
- Test de traitement batch

---

## 🎯 **Fonctionnalités Clés**

### **Recherche Intelligente**
```typescript
const result = await findBestCachedSegment(
    "Prenez une profonde inspiration",
    "voiceId",
    "calm",
    {
        useSemanticSearch: true,
        semanticThreshold: 0.85,
        language: 'fr-FR'
    }
);

// result.recommendation peut être :
// - 'use_exact' : Correspondance parfaite trouvée
// - 'use_similar' : Segment similaire trouvé (>85% similarité)
// - 'create_new' : Aucun segment approprié, créer nouveau
```

### **Génération Automatique d'Embeddings**
- Chaque nouveau segment audio génère automatiquement son embedding
- Traitement en arrière-plan (non-bloquant)
- Gestion d'erreurs robuste

### **Optimisation des Coûts**
- **Seuil de similarité ajustable** (défaut: 85%)
- **Réutilisation intelligente** des segments similaires
- **Batch processing** pour les mises à jour massives

---

## 📊 **Métriques et Performance**

### **Modèle utilisé :**
- **`text-embedding-3-small`** : 1536 dimensions
- **Coût** : ~$0.00002 / 1K tokens
- **Limite** : 8191 tokens par requête

### **Seuils recommandés :**
- **Similarité haute** : 0.9+ (quasi-identique)
- **Similarité moyenne** : 0.85+ (très similaire, réutilisable)
- **Similarité faible** : 0.7+ (similaire mais pas optimal)

### **Performance attendue :**
- **Génération embedding** : ~200ms par texte
- **Recherche sémantique** : ~50ms (dépend du nombre de segments)
- **Économies TTS** : 40-60% pour des contenus similaires

---

## 🔧 **Résolution de Problèmes**

### **Erreur : OPENAI_API_KEY manquante**
1. Créez un compte OpenAI
2. Générez une clé API
3. Ajoutez-la dans `.env.local`

### **Erreur : Embedding generation failed**
1. Vérifiez votre quota OpenAI
2. Vérifiez la connectivité internet
3. Vérifiez que le texte n'est pas vide

### **Erreur : Database connection**
1. Vérifiez que la migration est appliquée
2. Vérifiez `DATABASE_URL`
3. Testez la connexion Supabase

---

## 🎯 **Prochaines Étapes**

Une fois le service d'embeddings validé :

1. **✅ Étape 1** : Migration base de données (terminée)
2. **✅ Étape 2** : Service Embeddings OpenAI (terminée)
3. **🔄 Étape 3** : Agent IA - Logique d'optimisation intelligente
4. **⏳ Étape 4** : Service Assembly Audio - FFmpeg pour l'assemblage

---

## 💡 **Conseils d'Utilisation**

### **En développement :**
- Utilisez un seuil de similarité élevé (0.9+) pour tester
- Surveillez les logs pour comprendre les décisions
- Testez avec différents types de contenu

### **En production :**
- Ajustez le seuil selon vos besoins (0.85 recommandé)
- Surveillez les métriques de réutilisation
- Mettez à jour les embeddings périodiquement

---

## ✅ **Status**

**Étape 2** : Service Embeddings OpenAI - **PRÊT POUR TEST** ⏳

- ✅ Service d'embeddings créé
- ✅ Cache audio intégré
- ✅ Tests de validation créés
- ⏳ **En attente de test utilisateur** 