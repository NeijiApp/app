const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { createWriteStream } = require('fs');

/**
 * Télécharge un fichier depuis une URL
 * @param {string} url - URL du fichier à télécharger
 * @param {string} outputPath - Chemin de destination
 * @returns {Promise<string>} Chemin du fichier téléchargé
 */
async function downloadFile(url, outputPath) {
  try {
    console.log(`⬇️ Téléchargement: ${url}`);
    
    // Créer le dossier de destination s'il n'existe pas
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    // Configuration de la requête avec timeout
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000, // 30 secondes
      headers: {
        'User-Agent': 'Assembly-Service/1.0.0'
      }
    });

    // Vérifier le type de contenu
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('audio/')) {
      throw new Error(`Type de fichier invalide: ${contentType}`);
    }

    // Créer le stream d'écriture
    const writer = createWriteStream(outputPath);
    
    // Pipe la réponse vers le fichier
    response.data.pipe(writer);

    // Attendre la fin du téléchargement
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
      response.data.on('error', reject);
    });

    // Vérifier que le fichier a été créé
    const stats = await fs.stat(outputPath);
    console.log(`✅ Téléchargé: ${path.basename(outputPath)} (${Math.round(stats.size / 1024)}KB)`);

    return outputPath;

  } catch (error) {
    console.error(`❌ Erreur téléchargement ${url}:`, error.message);
    
    // Nettoyer le fichier partiellement téléchargé
    try {
      await fs.unlink(outputPath);
    } catch (unlinkError) {
      // Ignore si le fichier n'existe pas
    }
    
    throw new Error(`Échec du téléchargement: ${error.message}`);
  }
}

/**
 * Nettoie les fichiers temporaires anciens
 * @param {string} tempDir - Dossier temporaire à nettoyer
 * @param {number} maxAge - Âge maximum en millisecondes (défaut: 1 heure)
 */
async function cleanupTempFiles(tempDir, maxAge = 60 * 60 * 1000) {
  try {
    console.log(`🧹 Nettoyage du dossier: ${tempDir}`);
    
    const now = Date.now();
    let cleanedFiles = 0;
    let totalSize = 0;

    // Fonction récursive pour nettoyer
    async function cleanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Nettoyer récursivement les sous-dossiers
            await cleanDirectory(fullPath);
            
            // Supprimer le dossier s'il est vide
            try {
              await fs.rmdir(fullPath);
              console.log(`📁 Dossier vide supprimé: ${entry.name}`);
            } catch (error) {
              // Le dossier n'est pas vide, c'est normal
            }
          } else {
            // Vérifier l'âge du fichier
            const stats = await fs.stat(fullPath);
            const fileAge = now - stats.mtime.getTime();
            
            if (fileAge > maxAge) {
              totalSize += stats.size;
              await fs.unlink(fullPath);
              cleanedFiles++;
              console.log(`🗑️ Supprimé: ${entry.name} (${Math.round(fileAge / 1000 / 60)}min)`);
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erreur lors du nettoyage de ${dir}:`, error.message);
      }
    }

    await cleanDirectory(tempDir);
    
    const sizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
    console.log(`✅ Nettoyage terminé: ${cleanedFiles} fichiers supprimés (${sizeMB}MB libérés)`);
    
    return { cleanedFiles, totalSize };

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

/**
 * Vérifie l'espace disque disponible
 * @param {string} path - Chemin à vérifier
 * @returns {Promise<Object>} Informations sur l'espace disque
 */
async function checkDiskSpace(checkPath) {
  try {
    const { execSync } = require('child_process');
    
    // Commande différente selon l'OS
    let command;
    if (process.platform === 'win32') {
      command = `dir /-c "${checkPath}"`;
    } else {
      command = `df -h "${checkPath}"`;
    }
    
    const output = execSync(command, { encoding: 'utf8' });
    
    // Parse basique pour Linux/Unix
    if (process.platform !== 'win32') {
      const lines = output.trim().split('\n');
      const dataLine = lines[lines.length - 1];
      const parts = dataLine.split(/\s+/);
      
      return {
        total: parts[1],
        used: parts[2],
        available: parts[3],
        percentage: parts[4],
        path: checkPath
      };
    }
    
    // Pour Windows, retourner une structure basique
    return {
      path: checkPath,
      available: 'N/A',
      platform: process.platform
    };
    
  } catch (error) {
    console.warn('⚠️ Impossible de vérifier l\'espace disque:', error.message);
    return {
      path: checkPath,
      error: error.message
    };
  }
}

/**
 * Crée les dossiers nécessaires pour le service
 * @param {string} baseDir - Dossier de base
 */
async function ensureDirectories(baseDir) {
  const dirs = [
    path.join(baseDir, 'temp'),
    path.join(baseDir, 'temp', 'uploads'),
    path.join(baseDir, 'temp', 'output'),
    path.join(baseDir, 'temp', 'processing')
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Dossier créé: ${path.relative(baseDir, dir)}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`❌ Erreur création dossier ${dir}:`, error.message);
        throw error;
      }
    }
  }
}

/**
 * Obtient les statistiques des fichiers temporaires
 * @param {string} tempDir - Dossier temporaire
 */
async function getTempStats(tempDir) {
  try {
    let totalFiles = 0;
    let totalSize = 0;
    const filesByAge = { '1h': 0, '6h': 0, '24h': 0, 'older': 0 };
    
    const now = Date.now();
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            totalFiles++;
            totalSize += stats.size;
            
            const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
            if (ageHours < 1) filesByAge['1h']++;
            else if (ageHours < 6) filesByAge['6h']++;
            else if (ageHours < 24) filesByAge['24h']++;
            else filesByAge['older']++;
          }
        }
      } catch (error) {
        // Ignorer les erreurs de lecture de dossier
      }
    }
    
    await scanDirectory(tempDir);
    
    return {
      totalFiles,
      totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      filesByAge,
      lastScan: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du scan des stats:', error);
    return {
      error: error.message,
      lastScan: new Date().toISOString()
    };
  }
}

module.exports = {
  downloadFile,
  cleanupTempFiles,
  checkDiskSpace,
  ensureDirectories,
  getTempStats
}; 