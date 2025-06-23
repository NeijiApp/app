# 🎵 Assembly Audio Service

Service d'assemblage audio intelligent pour combiner des segments audio en méditations complètes avec FFmpeg.

## 🚀 Démarrage rapide avec Docker

### 1. Lancer le service
```bash
cd assembly-service
docker-compose up --build
```

### 2. Tester le service
```bash
# Test de santé
curl http://localhost:3000/api/health

# Test d'assemblage
node test-local.js
```

### 3. Utiliser l'API
```bash
curl -X POST http://localhost:3000/api/assembly/create \
  -H "Content-Type: application/json" \
  -d '{
    "segments": [
      {"audioUrl": "https://example.com/audio1.mp3", "duration": 5000, "silenceAfter": 2000},
      {"audioUrl": "https://example.com/audio2.mp3", "duration": 8000, "silenceAfter": 3000}
    ],
    "options": {
      "format": "mp3",
      "quality": "320k",
      "normalize": true
    }
  }'
```

## 📋 API Endpoints

### Health Check
- `GET /api/health` - Status complet du service
- `GET /api/health/simple` - Status simple (pour Docker)
- `GET /api/health/ready` - Vérification de disponibilité

### Assembly Audio
- `POST /api/assembly/create` - Créer un assemblage audio
- `GET /api/assembly/download/:jobId` - Télécharger le résultat
- `GET /api/assembly/status/:jobId` - Vérifier le statut d'un job

### Service Info
- `GET /` - Informations générales du service

## 🔧 Configuration

### Variables d'environnement
Copiez `config/env.example` vers `.env` et modifiez selon vos besoins :

```bash
# Configuration de base
NODE_ENV=development
PORT=3000
TEMP_DIR=/app/temp
MAX_FILE_SIZE=50mb
CLEANUP_INTERVAL=3600000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# Limites
MAX_SEGMENTS=20
MAX_DURATION=1800000
MAX_CONCURRENT_JOBS=5
```

## 🎯 Format des requêtes

### Créer un assemblage
```json
{
  "segments": [
    {
      "audioUrl": "https://example.com/segment1.mp3",
      "duration": 5000,
      "silenceAfter": 2000
    },
    {
      "audioUrl": "https://example.com/segment2.mp3", 
      "duration": 8000,
      "silenceAfter": 3000
    }
  ],
  "options": {
    "format": "mp3",
    "quality": "320k",
    "normalize": true,
    "fadeIn": 1000,
    "fadeOut": 2000
  }
}
```

### Réponse d'assemblage
```json
{
  "jobId": "uuid-v4",
  "status": "completed",
  "segments": 2,
  "duration": 18000,
  "fileSize": "2.5 MB",
  "format": "mp3",
  "quality": "320k",
  "downloadUrl": "/api/assembly/download/uuid-v4",
  "expiresAt": "2024-01-01T12:00:00.000Z",
  "completedAt": "2024-01-01T11:00:00.000Z"
}
```

## 🧪 Tests

### Tests automatisés
```bash
# Lancer tous les tests
node test-local.js

# Tests individuels
node -e "require('./test-local.js').testHealthCheck()"
node -e "require('./test-local.js').testAssemblyCreate()"
```

### Tests manuels avec curl
```bash
# 1. Vérifier la santé
curl http://localhost:3000/api/health

# 2. Tester l'assemblage
curl -X POST http://localhost:3000/api/assembly/create \
  -H "Content-Type: application/json" \
  -d @test-data.json

# 3. Télécharger le résultat
curl -O http://localhost:3000/api/assembly/download/JOB_ID
```

## 🐳 Déploiement

### Docker local
```bash
# Développement avec hot-reload
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up
```

### Railway
```bash
# 1. Connecter le repo
railway link

# 2. Déployer
git push origin main

# 3. Configurer les variables d'environnement
railway variables set NODE_ENV=production
railway variables set ALLOWED_ORIGINS=https://your-app.vercel.app
```

### AWS/VPS
```bash
# 1. Construire l'image
docker build -t assembly-service .

# 2. Lancer sur le serveur
docker run -d \
  -p 3000:3000 \
  -v /data/temp:/app/temp \
  -e NODE_ENV=production \
  -e ALLOWED_ORIGINS=https://your-app.vercel.app \
  --restart unless-stopped \
  assembly-service
```

## 🔍 Monitoring

### Logs
```bash
# Logs en temps réel
docker-compose logs -f assembly-service

# Logs d'un job spécifique
docker-compose logs assembly-service | grep "JOB_ID"
```

### Métriques
```bash
# Health check détaillé
curl http://localhost:3000/api/health | jq

# Statistiques mémoire
curl http://localhost:3000/api/health | jq '.checks.memory'

# Uptime
curl http://localhost:3000/api/health | jq '.checks.uptime'
```

## 🛠️ Développement

### Structure du projet
```
assembly-service/
├── server.js              # Serveur Express principal
├── routes/
│   ├── assembly.js        # Routes d'assemblage
│   └── health.js          # Routes de santé
├── lib/
│   ├── ffmpeg-wrapper.js  # Wrapper FFmpeg
│   └── file-manager.js    # Gestion des fichiers
├── config/
│   └── env.example        # Variables d'environnement
├── temp/                  # Fichiers temporaires
│   ├── uploads/           # Segments téléchargés
│   ├── output/            # Résultats finaux
│   └── processing/        # Traitement en cours
├── Dockerfile             # Image Docker
├── docker-compose.yml     # Orchestration locale
└── test-local.js          # Tests automatisés
```

### Ajouter des fonctionnalités
1. **Nouveau format audio** : Modifier `lib/ffmpeg-wrapper.js`
2. **Nouvelle route** : Ajouter dans `routes/`
3. **Nouveau middleware** : Modifier `server.js`
4. **Nouveaux tests** : Étendre `test-local.js`

## 📊 Performance

### Benchmarks typiques
- **2 segments (10min total)** : ~5-15 secondes
- **5 segments (20min total)** : ~15-30 secondes
- **Mémoire utilisée** : ~50-200MB par job
- **Stockage temporaire** : ~2x la taille finale

### Optimisations
- Cache des segments fréquents
- Nettoyage automatique (1h par défaut)
- Traitement parallèle possible
- Compression optimisée

## 🔒 Sécurité

### Recommandations production
```bash
# Variables d'environnement sécurisées
API_KEY=your-secret-key
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Reverse proxy (nginx)
proxy_pass http://localhost:3000;
proxy_set_header X-Real-IP $remote_addr;
```

### Limites par défaut
- Taille max fichier : 50MB
- Segments max : 20
- Durée max : 30 minutes
- Jobs concurrents : 5

## 🆘 Dépannage

### Problèmes courants

**FFmpeg non trouvé**
```bash
# Vérifier l'installation
docker-compose exec assembly-service ffmpeg -version
```

**Espace disque insuffisant**
```bash
# Nettoyer manuellement
curl -X POST http://localhost:3000/api/cleanup
```

**Timeout sur gros fichiers**
```bash
# Augmenter les timeouts
ASSEMBLY_TIMEOUT=120000
DOWNLOAD_TIMEOUT=60000
```

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation** : Ce README
- **Tests** : `node test-local.js`
- **Logs** : `docker-compose logs -f`

---

🎵 **Assembly Audio Service** - Transformez vos segments audio en méditations parfaites ! 