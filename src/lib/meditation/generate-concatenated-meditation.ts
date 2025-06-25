import { writeFile, unlink, mkdtemp, copyFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { generateParagraphAudio } from "./generate-paragraph-audio";
import { v4 as uuidv4 } from "uuid";

type Segment = { type: "text"; content: string } | { type: "pause"; duration: number };

// Configuration du service assembly
const ASSEMBLY_SERVICE_URL = "http://localhost:3001";
const ASSEMBLY_SHARED_DIR = join(process.cwd(), "assembly-service", "temp", "uploads");

async function generateConcatenatedMeditation(
	segments: Segment[],
	voiceId?: string,
	voiceGender?: 'male' | 'female',
): Promise<ReadableStream<Uint8Array>> {
	// Create a unique temporary directory for this request.
	const tempDir = await mkdtemp(join(tmpdir(), "meditation-"));
	const jobId = uuidv4();
	const tempFiles: { audioUrl: string; duration: number; silenceAfter?: number }[] = [];

	try {
		// Ensure assembly shared directory exists
		await mkdir(ASSEMBLY_SHARED_DIR, { recursive: true });

		// 1. Generate audio segments and copy to shared directory
		let segmentIndex = 0;
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			if (!segment) continue;

			if (segment.type === "text") {
				console.log(`📝 Generating text segment ${segmentIndex + 1}: "${segment.content.substring(0, 50)}..."`);
				
				// Use provided voiceId or default to female voice
				const selectedVoiceId = voiceId || "g6xIsTj2HwM6VR4iXFCw";
				const selectedVoiceGender = voiceGender || (selectedVoiceId === 'g6xIsTj2HwM6VR4iXFCw' ? 'female' : 'male');
				console.log(`🎤 Using voice ID: ${selectedVoiceId} (${selectedVoiceGender})`);
				
				// Generate audio for this text segment
				const audioStream = await generateParagraphAudio(segment.content, {
					voice_id: selectedVoiceId,
					voice_gender: selectedVoiceGender,
					voice_style: "calm",
				});
				
				// Save to temporary file first
				const tempFile = join(tempDir, `segment-${segmentIndex}.mp3`);
				const audioBuffer = await streamToBuffer(audioStream);
				await writeFile(tempFile, audioBuffer);
				
				// Copy to shared directory with unique name
				const sharedFileName = `${jobId}_segment_${segmentIndex}.mp3`;
				const sharedFilePath = join(ASSEMBLY_SHARED_DIR, sharedFileName);
				await copyFile(tempFile, sharedFilePath);
				
				// Le service assembly utilisera le nom de fichier relatif
				tempFiles.push({
					audioUrl: sharedFileName, // Nom de fichier seulement, pas le chemin complet
					duration: 3000, // Estimated duration in ms
					silenceAfter: 0
				});
				
				segmentIndex++;
			} else {
				console.log(`⏸️ Generating pause segment ${i + 1}: ${segment.duration}s`);
				// For pauses, add silence after the previous segment
				if (tempFiles.length > 0) {
					const lastSegment = tempFiles[tempFiles.length - 1];
					if (lastSegment) {
						lastSegment.silenceAfter = segment.duration * 1000; // Convert to ms
					}
				}
			}
		}

		console.log("📄 Prepared segments for assembly service.");

		// 2. Call assembly service
		console.log(`🔗 Calling assembly service at ${ASSEMBLY_SERVICE_URL}`);
		
		const assemblyResponse = await fetch(`${ASSEMBLY_SERVICE_URL}/api/assembly/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				segments: tempFiles,
				options: {
					format: 'mp3',
					quality: '320k',
					normalize: true
				}
			})
		});

		if (!assemblyResponse.ok) {
			const errorText = await assemblyResponse.text();
			throw new Error(`Assembly service error: ${assemblyResponse.status} - ${errorText}`);
		}

		const assemblyResult = await assemblyResponse.json();
		console.log(`✅ Assembly job created: ${assemblyResult.jobId}`);

		// 3. Download the assembled meditation
		const downloadUrl = `${ASSEMBLY_SERVICE_URL}${assemblyResult.downloadUrl}`;
		console.log(`⬇️ Downloading from: ${downloadUrl}`);
		
		const downloadResponse = await fetch(downloadUrl);
		
		if (!downloadResponse.ok) {
			throw new Error(`Download failed: ${downloadResponse.status}`);
		}

		// 4. Return the audio stream
		const finalStream = new ReadableStream<Uint8Array>({
			start(controller) {
				if (!downloadResponse.body) {
					controller.error(new Error("No response body"));
					return;
				}

				const reader = downloadResponse.body.getReader();
				
				const pump = async () => {
					try {
						while (true) {
							const { done, value } = await reader.read();
							if (done) {
								controller.close();
								break;
							}
							controller.enqueue(value);
						}
					} catch (error) {
						controller.error(error);
					} finally {
						// Clean up temporary files
						cleanup(tempDir, jobId, false);
					}
				};
				
				pump();
			},
		});

		console.log('✅ Meditation generation complete via assembly service');
		return finalStream;

	} catch (error) {
		console.error("Error in meditation generation pipeline:", error);
		await cleanup(tempDir, jobId, true);
		throw error;
	}
}

// Helper function to convert a ReadableStream to a Buffer.
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}
	return Buffer.concat(chunks);
}

// Helper function to safely delete temporary files.
async function cleanup(dir: string, jobId: string, includeSelf: boolean) {
	try {
		// Clean up local temp directory
		const files = await require("fs/promises").readdir(dir);
		for (const file of files) {
			if (file.startsWith("segment-")) {
				await unlink(join(dir, file));
			}
		}
		if (includeSelf) {
			await require("fs/promises").rmdir(dir);
		}

		// Clean up shared directory files
		try {
			const sharedFiles = await require("fs/promises").readdir(ASSEMBLY_SHARED_DIR);
			for (const file of sharedFiles) {
				if (file.startsWith(`${jobId}_`)) {
					await unlink(join(ASSEMBLY_SHARED_DIR, file));
				}
			}
		} catch (err) {
			console.warn(`⚠️ Could not clean shared directory: ${err}`);
		}

		console.log(`🗑️ Cleaned up temporary files for job: ${jobId}`);
	} catch (err) {
		console.error(`🧹 Failed to clean up temporary directory ${dir}:`, err);
	}
}

export { generateConcatenatedMeditation }; 