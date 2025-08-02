# Utiliser Node.js Alpine pour une image légère
FROM node:18-alpine

# Installer FFmpeg et autres outils nécessaires
RUN apk add --no-cache \
    ffmpeg \
    curl \
    bash

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S assembly -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json depuis assembly-service
COPY assembly-service/package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source depuis assembly-service
COPY assembly-service/ .

# Créer les dossiers nécessaires
RUN mkdir -p temp/uploads temp/output temp/processing

# Changer les permissions
RUN chown -R assembly:nodejs /app

# Utiliser l'utilisateur non-root
USER assembly

# Exposer le port (Railway will override with PORT env var)
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV TEMP_DIR=/app/temp
ENV MAX_FILE_SIZE=50mb
ENV CLEANUP_INTERVAL=3600000

# Health check (Railway uses dynamic PORT, disable Docker healthcheck)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:$PORT/api/health || exit 1

# Commande de démarrage avec le serveur simplifié
CMD ["node", "serveur-assemblage.js"] 