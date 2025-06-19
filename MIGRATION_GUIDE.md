# 🗄️ Guide de Migration - Agent IA avec Drizzle

## 📋 **ÉTAPE 1 : Migration Base de Données ✅**

### **Objectif**
Ajouter le support des embeddings vectoriels et du multilingue à la table `audio_segments_cache` pour permettre la recherche sémantique intelligente.

### **Approche Drizzle (Correcte) 🎯**

Vous aviez raison ! Avec **Drizzle**, le workflow correct est :

1. **Modifier le schéma TypeScript** : `src/server/db/schema.ts`
2. **Générer la migration** : `pnpm run db:generate`
3. **Appliquer la migration** : `pnpm run db:push`

Drizzle génère automatiquement les fichiers SQL en comparant le schéma avec l'état actuel.

### **Migration Générée**
- **Fichier** : `supabase/migrations/0000_zippy_ser_duncan.sql`
- **Méthode** : Génération automatique via Drizzle Kit
- **Contenu** : Création complète de toutes les tables avec les nouvelles colonnes

### **Nouvelles colonnes dans `audio_segments_cache`** :
- `embedding` : text pour OpenAI embeddings (stocké comme JSON string)
- `language` : varchar(10) pour le code langue (défaut: 'fr-FR')
- `similarity_threshold` : real pour le seuil de similarité (défaut: 0.92)

### **Index créés automatiquement** :
- `idx_audio_segments_cache_language` - Index sur la langue
- `idx_audio_segments_cache_text_hash` - Index sur le hash de texte
- `idx_audio_segments_cache_voice_id` - Index sur l'ID de voix
- `idx_audio_segments_cache_usage_count` - Index sur le compteur d'usage
- `idx_audio_segments_cache_last_used` - Index sur la dernière utilisation

---

## 🚀 **Instructions d'application**

### **1. Appliquer la migration**
```bash
# Méthode recommandée - via Drizzle
pnpm run db:push

# Alternative - via Supabase CLI  
supabase db push
```

### **2. Important** ⚠️
Cette migration va **créer toutes les tables depuis zéro**. Si vous avez des données existantes, sauvegardez-les d'abord.

### **3. Vérification**
Après application, vérifiez que :
- ✅ Toutes les tables sont créées
- ✅ Colonnes `embedding`, `language`, `similarity_threshold` présentes
- ✅ Index créés automatiquement
- ✅ Contraintes et relations fonctionnelles

---

## 🛠️ **Composants mis à jour**

### **Schéma Drizzle** (`src/server/db/schema.ts`)
- Synchronisé avec `pnpm run db:pull`
- Noms de colonnes en camelCase (ex: `textContent`, `voiceId`)
- Types TypeScript corrects

### **Cache Audio** (`src/lib/meditation/audio-cache.ts`)
- Fonctions de hash SHA-256 
- Calcul de similarité (distance de Levenshtein)
- Interface avec les nouvelles colonnes
- Support complet des embeddings

---

## 🎓 **Leçon Apprise**

### **Migration manuelle vs Drizzle** :
- ❌ Créer manuellement les fichiers `.sql` 
- ✅ Modifier le schéma TypeScript et laisser Drizzle générer les migrations
- ✅ Plus sûr, plus maintenable, types synchronisés automatiquement

### **Workflow Drizzle recommandé** :
```bash
# 1. Modifier src/server/db/schema.ts
# 2. Générer la migration
pnpm run db:generate

# 3. Appliquer à la base
pnpm run db:push

# 4. Optionnel: Synchroniser depuis la base
pnpm run db:pull
```

---

## 🎯 **Prochaines étapes**

Une fois cette migration validée :
1. **Service Embeddings OpenAI** - Générer et stocker les embeddings
2. **Agent IA** - Logique de recherche et optimisation  
3. **Service Assembly Audio** - FFmpeg pour l'assemblage
4. **Interface utilisateur** - Streaming et feedback temps réel

---

## ✅ **Status** 

**Étape 1** : Migration base de données - **TERMINÉE** ✅
- Migration Drizzle générée
- Schéma TypeScript synchronisé  
- Cache audio mis à jour
- Prêt pour l'étape 2 (Service Embeddings) 