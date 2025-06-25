const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

/**
 * Assemble plusieurs segments audio avec FFmpeg
 * @param {Array<Object>} segments - Liste des segments avec localPath, duration, silenceAfter
 * @param {string} outputPath - Chemin de sortie du fichier final
 * @param {Object} options - Options d'assemblage
 */
async function assembleAudioSegments(segments, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`🔧 FFmpeg: Assemblage de ${segments.length} segments`);
      
      const {
        format = 'mp3',
        quality = '320k',
        normalize = true,
        fadeIn = 0,
        fadeOut = 0
      } = options;

      // Créer la commande FFmpeg
      let command = ffmpeg();

      // Ajouter tous les fichiers d'entrée
      segments.forEach((segment, index) => {
        console.log(`📂 Ajout segment ${index + 1}: ${path.basename(segment.localPath)}`);
        command = command.input(segment.localPath);
      });

      // Construire le filtre complexe pour l'assemblage
      const filters = [];
      let filterGraph = '';

      // Si on a plusieurs segments, on doit les concaténer
      if (segments.length > 1) {
        // Préparer chaque segment avec silence si nécessaire
        segments.forEach((segment, index) => {
          const silenceAfter = segment.silenceAfter || 0;
          
          if (silenceAfter > 0) {
            // Ajouter un silence après le segment
            const silenceDuration = silenceAfter / 1000; // Convertir ms en secondes
            filters.push(`[${index}:0]apad=pad_dur=${silenceDuration}[seg${index}]`);
          } else {
            // Pas de silence, juste renommer le stream
            filters.push(`[${index}:0]anull[seg${index}]`);
          }
        });

        // Concaténer tous les segments
        const segmentInputs = segments.map((_, index) => `[seg${index}]`).join('');
        filters.push(`${segmentInputs}concat=n=${segments.length}:v=0:a=1[concat]`);
        
        // Normalisation si demandée
        if (normalize) {
          filters.push('[concat]loudnorm=I=-16:TP=-1.5:LRA=11[normalized]');
          filterGraph = '[normalized]';
        } else {
          filterGraph = '[concat]';
        }

        // Fade in/out si demandé
        if (fadeIn > 0 || fadeOut > 0) {
          let fadeFilter = filterGraph;
          if (fadeIn > 0) {
            fadeFilter = `${fadeFilter}afade=t=in:ss=0:d=${fadeIn / 1000}[fadein]`;
            filterGraph = '[fadein]';
          }
          if (fadeOut > 0) {
            // Calculer la durée totale pour le fade out
            const totalDuration = segments.reduce((total, seg) => 
              total + seg.duration + (seg.silenceAfter || 0), 0) / 1000;
            fadeFilter = `${filterGraph}afade=t=out:st=${totalDuration - (fadeOut / 1000)}:d=${fadeOut / 1000}[fadeout]`;
            filterGraph = '[fadeout]';
          }
          filters[filters.length - 1] = fadeFilter;
        }

      } else {
        // Un seul segment, juste normaliser si nécessaire
        if (normalize) {
          filters.push('[0:0]loudnorm=I=-16:TP=-1.5:LRA=11[output]');
          filterGraph = '[output]';
        } else {
          filterGraph = '[0:0]';
        }
      }

      console.log(`🎛️ Filtres FFmpeg: ${filters.length} étapes`);
      
      // Appliquer les filtres
      if (filters.length > 0) {
        command = command.complexFilter(filters, filterGraph.replace(/[\[\]]/g, ''));
      }

      // Configuration de sortie
      command
        .audioCodec('libmp3lame')
        .audioBitrate(quality)
        .audioChannels(2) // Stéréo
        .audioFrequency(44100)
        .format(format)
        .output(outputPath);

      // Gestion des événements
      command
        .on('start', (commandLine) => {
          console.log('🚀 FFmpeg démarré:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`⏳ Progression: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ FFmpeg terminé avec succès');
          resolve(outputPath);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('❌ Erreur FFmpeg:', err.message);
          console.error('📝 STDERR:', stderr);
          reject(new Error(`Erreur FFmpeg: ${err.message}`));
        });

      // Lancer la commande
      command.run();

    } catch (error) {
      console.error('❌ Erreur lors de la préparation FFmpeg:', error);
      reject(error);
    }
  });
}

/**
 * Génère un fichier de silence
 * @param {number} duration - Durée en millisecondes
 * @param {string} outputPath - Chemin de sortie
 */
async function generateSilence(duration, outputPath) {
  return new Promise((resolve, reject) => {
    const durationSeconds = duration / 1000;
    
    ffmpeg()
      .input(`anullsrc=channel_layout=stereo:sample_rate=44100`)
      .inputFormat('lavfi')
      .duration(durationSeconds)
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .output(outputPath)
      .on('end', () => {
        console.log(`🔇 Silence généré: ${durationSeconds}s`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('❌ Erreur génération silence:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Obtient les informations d'un fichier audio
 * @param {string} filePath - Chemin du fichier
 */
async function getAudioInfo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
      if (!audioStream) {
        reject(new Error('Aucun stream audio trouvé'));
        return;
      }

      resolve({
        duration: parseFloat(metadata.format.duration || '0') * 1000, // en ms
        bitrate: parseInt(metadata.format.bit_rate || '0') || 0,
        sampleRate: audioStream.sample_rate,
        channels: audioStream.channels,
        codec: audioStream.codec_name,
        size: parseInt(metadata.format.size || '0') || 0
      });
    });
  });
}

module.exports = {
  assembleAudioSegments,
  generateSilence,
  getAudioInfo
}; 