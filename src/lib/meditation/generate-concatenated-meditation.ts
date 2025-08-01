import { mkdtemp, writeFile, readFile, copyFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateParagraphAudioWithRouter } from './tts-router';

type Segment = { type: 'text'; content: string } | { type: 'pause'; duration: number };

/**
 * Génère et assemble localement tous les segments de méditation en un seul fichier audio MP3.
 */
export async function generateConcatenatedMeditation(
	segments: Segment[],
	voiceId?: string,
	voiceGender?: 'male' | 'female',
): Promise<ReadableStream<Uint8Array>> {
	// Répertoire temporaire pour cette requête
	const tempDir = await mkdtemp(join(tmpdir(), 'meditation-'));
	const audioFiles: Array<{ localPath: string; silenceAfter?: number }> = [];

	// Générer les fichiers audio pour chaque segment
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i]!;
		if (seg.type === 'text') {
			const stream = await generateParagraphAudioWithRouter(seg.content, {
				voice_id: voiceId!,
				voice_gender: voiceGender,
				voice_style: 'calm',
			});
			// Lire le flux et écrire en fichier
			const buffer = await new Response(stream).arrayBuffer();
			const filePath = join(tempDir, `segment-${i}.mp3`);
			await writeFile(filePath, Buffer.from(buffer));
			audioFiles.push({ localPath: filePath });
		} else {
			// Pause : appliquer silence sur le segment précédent
			const silenceMs = seg.duration * 1000;
			if (audioFiles.length > 0) {
				audioFiles[audioFiles.length - 1]!.silenceAfter = silenceMs;
			}
		}
	}

	// Chemin de sortie final
	const outputPath = join(tempDir, 'meditation-final.mp3');
	// Assemblage avec le service assembly externe
	try {
		const assemblyServiceUrl = process.env.ASSEMBLY_SERVICE_URL || 'http://localhost:3001';
		const assemblyUploadsDir = join(process.cwd(), 'assembly-service', 'temp', 'uploads');
		
		// S'assurer que le dossier uploads existe
		await mkdir(assemblyUploadsDir, { recursive: true });
		
		// Copier les fichiers vers le dossier uploads du service assembly
		const assemblySegments = [];
		for (let i = 0; i < audioFiles.length; i++) {
			const file = audioFiles[i]!;
			const fileName = `segment-${Date.now()}-${i}.mp3`;
			const targetPath = join(assemblyUploadsDir, fileName);
			
			await copyFile(file.localPath, targetPath);
			console.log(`📁 Copied ${file.localPath} to ${targetPath}`);
			
			assemblySegments.push({
				id: `segment-${i}`,
				audioUrl: fileName, // Juste le nom du fichier
				duration: 30, // Durée estimée en secondes
				silenceAfter: file.silenceAfter || 0
			});
		}

		console.log(`🔧 Calling assembly service at ${assemblyServiceUrl} with ${assemblySegments.length} segments`);

		const response = await fetch(`${assemblyServiceUrl}/api/assembly/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				segments: assemblySegments
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Assembly service error: ${response.status} ${response.statusText} - ${errorText}`);
		}

		const result = await response.json();
		console.log(`✅ Assembly completed: ${result.jobId}`);

		// Télécharger le fichier assemblé
		const downloadResponse = await fetch(`${assemblyServiceUrl}${result.downloadUrl}`);
		if (!downloadResponse.ok || !downloadResponse.body) {
			throw new Error('Failed to download assembled audio');
		}

		// Sauvegarder temporairement pour retour
		const buffer = await new Response(downloadResponse.body).arrayBuffer();
		await writeFile(outputPath, Buffer.from(buffer));
		
		console.log(`✅ Assembly service completed successfully`);
	} catch (error) {
		console.error('❌ Assembly service failed:', error);
		throw new Error(`Audio assembly failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	// Lire le fichier final et renvoyer un ReadableStream
	const data = await readFile(outputPath);
	return new Response(data).body as ReadableStream<Uint8Array>;
}
