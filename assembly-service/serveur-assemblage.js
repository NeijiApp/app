const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

console.log('🚀 Assembly Service - Version Simplifiée');

// Route de base
app.get('/', (req, res) => {
  res.json({
    service: 'Assembly Audio Service',
    version: '1.0.0-simple',
    status: 'running',
    endpoints: {
      health: '/api/health',
      assembly: '/api/assembly/create',
      download: '/api/assembly/download/:jobId'
    }
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Assembly Audio Service',
      version: '1.0.0-simple',
      checks: {}
    };

    // Test FFmpeg
    try {
      const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf8', timeout: 5000 });
      health.checks.ffmpeg = {
        status: 'ok',
        version: ffmpegVersion.split('\n')[0]
      };
    } catch (error) {
      health.checks.ffmpeg = {
        status: 'error',
        error: 'FFmpeg non disponible'
      };
      health.status = 'unhealthy';
    }

    // Test dossiers
    try {
      const tempDir = path.join(__dirname, 'temp');
      await fs.mkdir(path.join(tempDir, 'uploads'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'output'), { recursive: true });
      health.checks.storage = { status: 'ok' };
    } catch (error) {
      health.checks.storage = { status: 'error', error: error.message };
      health.status = 'unhealthy';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Fonction de téléchargement de fichier
async function downloadFile(url, outputPath) {
  try {
    console.log(`⬇️ Téléchargement: ${url}`);
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000
    });

    const writer = require('fs').createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Téléchargé: ${outputPath}`);
        resolve(outputPath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Erreur téléchargement ${url}:`, error.message);
    throw error;
  }
}

// Fonction d'assemblage FFmpeg
async function assembleAudio(segments, outputPath) {
  try {
    console.log(`🔧 Assemblage de ${segments.length} segments`);
    
    // Créer un fichier de liste pour FFmpeg
    const listPath = outputPath.replace('.mp3', '_list.txt');
    const listContent = segments.map(seg => `file '${seg.localPath}'`).join('\n');
    await fs.writeFile(listPath, listContent);

    // Commande FFmpeg pour concaténer
    const command = `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
    console.log(`🎵 Commande: ${command}`);
    
    execSync(command, { timeout: 60000 });
    
    // Nettoyer le fichier de liste
    await fs.unlink(listPath);
    
    console.log(`✅ Assemblage terminé: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error(`❌ Erreur assemblage:`, error.message);
    throw error;
  }
}

// Route d'assemblage
app.post('/api/assembly/create', async (req, res) => {
  const jobId = uuidv4();
  console.log(`🎵 Nouveau job: ${jobId}`);

  try {
    const { segments } = req.body;

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({
        error: 'Segments audio requis',
        jobId
      });
    }

    console.log(`📊 Job ${jobId}: ${segments.length} segments à traiter`);

    // Télécharger tous les segments
    const downloadedSegments = [];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment.audioUrl) {
        throw new Error(`Segment ${i} sans audioUrl`);
      }

      const localPath = path.join(__dirname, 'temp', 'uploads', `${jobId}_segment_${i}.mp3`);
      await downloadFile(segment.audioUrl, localPath);
      
      downloadedSegments.push({
        ...segment,
        localPath,
        index: i
      });
    }

    console.log(`✅ Job ${jobId}: Tous les segments téléchargés`);

    // Assembler avec FFmpeg
    const outputPath = path.join(__dirname, 'temp', 'output', `${jobId}_final.mp3`);
    await assembleAudio(downloadedSegments, outputPath);

    // Vérifier le résultat
    const stats = await fs.stat(outputPath);
    const fileSizeMB = Math.round(stats.size / 1024 / 1024 * 100) / 100;

    // Nettoyer les fichiers temporaires
    for (const segment of downloadedSegments) {
      try {
        await fs.unlink(segment.localPath);
      } catch (error) {
        console.warn(`⚠️ Impossible de supprimer ${segment.localPath}`);
      }
    }

    const result = {
      jobId,
      status: 'completed',
      segments: segments.length,
      fileSize: fileSizeMB + ' MB',
      downloadUrl: `/api/assembly/download/${jobId}`,
      completedAt: new Date().toISOString()
    };

    console.log(`🎉 Job ${jobId}: Succès - ${fileSizeMB}MB`);
    res.json(result);

  } catch (error) {
    console.error(`❌ Job ${jobId} échoué:`, error.message);
    
    res.status(500).json({
      error: 'Erreur lors de l\'assemblage',
      message: error.message,
      jobId,
      failedAt: new Date().toISOString()
    });
  }
});

// Route de téléchargement
app.get('/api/assembly/download/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const filePath = path.join(__dirname, 'temp', 'output', `${jobId}_final.mp3`);

    await fs.access(filePath);
    const stats = await fs.stat(filePath);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="meditation_${jobId}.mp3"`);

    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

    console.log(`📥 Téléchargement: ${jobId} (${Math.round(stats.size / 1024 / 1024 * 100) / 100}MB)`);

  } catch (error) {
    console.error('Erreur téléchargement:', error.message);
    
    if (error.code === 'ENOENT') {
      res.status(404).json({
        error: 'Fichier non trouvé',
        message: 'Le fichier a peut-être expiré'
      });
    } else {
      res.status(500).json({
        error: 'Erreur lors du téléchargement',
        message: error.message
      });
    }
  }
});

// Gestion d'erreurs
app.use((error, req, res, next) => {
  console.error('Erreur:', error.message);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: error.message
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 Assembly Service démarré sur le port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Ready to assemble audio segments!`);
});

module.exports = app; 