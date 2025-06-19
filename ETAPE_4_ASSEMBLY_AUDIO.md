# 🎵 ÉTAPE 4 : Assembly Audio FFmpeg - Service d'Assemblage Audio

## 📋 **OBJECTIF**

Créer un service d'assemblage audio intelligent qui :
- **Combine** tous les segments audio générés en une méditation complète
- **Optimise** la qualité audio finale (normalisation, transitions)
- **Gère** les silences et transitions entre segments
- **Déploie** sur un service externe (Railway/Render) car Vercel ne supporte pas FFmpeg
- **Intègre** parfaitement avec l'Agent IA de l'étape 3

---

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **Limitation Vercel**
❌ **Vercel Serverless** : Pas de binaires système (FFmpeg impossible)
✅ **Solution** : Service externe dédié avec FFmpeg natif

### **Architecture Hybride**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   VERCEL        │    │  SERVICE EXTERNE │    │   UTILISATEUR   │
│                 │    │  (Railway/Render)│    │                 │
│ 🧠 Agent IA     │───▶│ 🎵 FFmpeg        │───▶│ 🎧 Audio Final  │
│ 📊 Cache        │    │ 🔧 Assembly      │    │                 │
│ 🎯 Décisions    │    │ 🎛️  Optimisation │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🎯 **FONCTIONNALITÉS CIBLES**

### **1. Assembly Audio**
- **Concaténation** de segments audio multiples
- **Transitions** fluides entre segments
- **Silences** configurables (3-20 secondes)
- **Normalisation** audio automatique

### **2. Optimisation Qualité**
- **Égalisation** des volumes entre segments
- **Suppression** des artefacts de début/fin
- **Compression** audio optimale (MP3 320kbps)
- **Métadonnées** intégrées (titre, durée, etc.)

### **3. Performance**
- **Traitement parallèle** des segments
- **Cache** des assemblages fréquents
- **Streaming** du résultat final
- **Timeout** intelligent (60s max)

---

## 📦 **STACK TECHNIQUE**

### **Service Assembly (Externe)**
- **Runtime** : Node.js 20+
- **Framework** : Express.js/Fastify
- **Audio** : FFmpeg natif + fluent-ffmpeg
- **Déploiement** : Railway ou Render
- **Storage** : Stockage temporaire + nettoyage auto

### **Intégration Vercel**
- **API Route** : `/api/meditation-complete`
- **Proxy** vers service externe
- **Gestion d'erreurs** et fallbacks
- **Monitoring** des performances

---

## 🔧 **COMPOSANTS À DÉVELOPPER**

### **1. Service Assembly (Externe)**
```
assembly-service/
├── package.json           # Dependencies FFmpeg
├── server.js             # Server Express
├── routes/
│   ├── assembly.js       # Route d'assemblage
│   └── health.js         # Health check
├── lib/
│   ├── ffmpeg-wrapper.js # Wrapper FFmpeg
│   ├── audio-processor.js # Traitement audio
│   └── file-manager.js   # Gestion fichiers temp
├── config/
│   └── ffmpeg.js         # Configuration FFmpeg
└── Dockerfile            # Pour déploiement
```

### **2. Intégration Vercel**
```
src/lib/assembly/
├── assembly-client.ts    # Client pour service externe
├── assembly-types.ts    # Types TypeScript
└── assembly-utils.ts    # Utilitaires
```

### **3. API Routes**
```
src/app/api/
├── meditation-complete/  # Route complète avec assembly
│   └── route.ts
└── assembly/
    ├── status/route.ts   # Status assemblage
    └── download/route.ts # Téléchargement
```

---

## 🎵 **WORKFLOW D'ASSEMBLAGE**

### **Étape 1 : Préparation**
1. **Agent IA** génère les segments optimisés
2. **Vérification** de la disponibilité des fichiers audio
3. **Calcul** des durées et transitions nécessaires

### **Étape 2 : Assembly**
1. **Envoi** des segments au service externe
2. **Traitement FFmpeg** en parallèle
3. **Assembly** avec transitions et silences
4. **Optimisation** qualité finale

### **Étape 3 : Livraison**
1. **Upload** du fichier final (temporaire)
2. **Streaming** vers le client
3. **Nettoyage** automatique des fichiers temp

---

## 📊 **MÉTRIQUES DE PERFORMANCE**

### **Objectifs Cibles**
- **Temps assembly** : <15 secondes (méditation 10min)
- **Qualité audio** : 320kbps MP3, normalisé
- **Taux de succès** : >98%
- **Taille fichier** : Optimisée (~2-5MB pour 10min)

### **Monitoring**
- **Temps de traitement** par segment
- **Taux d'erreur** FFmpeg
- **Usage ressources** CPU/RAM
- **Latence réseau** Vercel ↔ Service

---

## 🚀 **PLAN DE DÉVELOPPEMENT**

### **Phase 1 : Service Assembly de Base (2-3h)**
1. ✅ Setup projet Node.js avec FFmpeg
2. ✅ Route d'assemblage basique
3. ✅ Tests avec fichiers audio statiques
4. ✅ Déploiement sur Railway/Render

### **Phase 2 : Intégration Vercel (1-2h)**
1. ✅ Client TypeScript pour service externe
2. ✅ API Route `/api/meditation-complete`
3. ✅ Gestion d'erreurs et timeouts
4. ✅ Tests d'intégration

### **Phase 3 : Optimisations (1-2h)**
1. ✅ Transitions audio fluides
2. ✅ Normalisation et compression
3. ✅ Cache des assemblages
4. ✅ Monitoring et métriques

### **Phase 4 : Production (30min)**
1. ✅ Configuration environnement
2. ✅ Tests de charge
3. ✅ Documentation utilisateur
4. ✅ Mise en production

---

## 🔗 **INTÉGRATION AVEC L'AGENT IA**

### **Workflow Complet**
```typescript
// 1. Agent IA génère les segments optimisés
const segments = await aiAgent.generateOptimizedSegments(request);

// 2. Assembly des segments audio
const assemblyRequest = {
  segments: segments.map(s => ({
    audioUrl: s.audioUrl,
    duration: s.duration,
    silenceAfter: s.silenceAfter
  })),
  options: {
    normalize: true,
    format: 'mp3',
    quality: '320k'
  }
};

// 3. Envoi au service assembly
const finalAudio = await assemblyClient.assembleAudio(assemblyRequest);

// 4. Retour à l'utilisateur
return finalAudio;
```

---

## 🛠️ **CONFIGURATION REQUISE**

### **Variables d'environnement**
```bash
# Service Assembly (Externe)
FFMPEG_PATH="/usr/bin/ffmpeg"          # Chemin FFmpeg
TEMP_DIR="/tmp/audio"                  # Dossier temporaire
MAX_FILE_SIZE="50MB"                   # Limite taille
CLEANUP_INTERVAL="3600"                # Nettoyage (1h)

# Vercel (Intégration)
ASSEMBLY_SERVICE_URL="https://..."     # URL service externe
ASSEMBLY_API_KEY="secret_key"          # Clé d'authentification
ASSEMBLY_TIMEOUT="60000"               # Timeout (60s)
```

### **Dépendances**
```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.3",
    "@types/fluent-ffmpeg": "^2.1.27",
    "express": "^4.18.2",
    "multer": "^1.4.5",
    "axios": "^1.8.4"
  }
}
```

---

## 🎯 **RÉSULTATS ATTENDUS**

### **Performance**
- **Assembly 5min** : ~8-10 secondes
- **Assembly 10min** : ~12-15 secondes
- **Qualité audio** : Professionnelle
- **Fiabilité** : >98% succès

### **Expérience Utilisateur**
- **Loading** avec progression temps réel
- **Preview** audio avant assembly complet
- **Download** instantané post-assembly
- **Qualité** constante et optimisée

---

## 📝 **PROCHAINES ACTIONS**

1. **🚀 Créer le service Assembly externe**
2. **🔗 Intégrer avec l'Agent IA existant**
3. **🧪 Tests avec vrais segments audio**
4. **📊 Monitoring et optimisations**
5. **🎉 Mise en production complète**

---

## 💡 **NOTES IMPORTANTES**

- **FFmpeg** doit être installé nativement sur le service externe
- **Nettoyage automatique** des fichiers temporaires essentiel
- **Gestion d'erreurs** robuste pour la production
- **Monitoring** des performances en temps réel
- **Fallback** en cas d'indisponibilité du service assembly 