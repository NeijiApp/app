import { PassThrough } from "node:stream";
import ffmpeg from "fluent-ffmpeg";
import { writeFile, unlink, mkdtemp, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateParagraphAudio } from "./generate-paragraph-audio";

type Segment = { type: "text"; content: string } | { type: "pause"; duration: number };

// Path to the pre-made silent audio file.
const SILENT_AUDIO_PATH = join(process.cwd(), "src/assets/silence.mp3");

async function generateConcatenatedMeditation(
	segments: Segment[],
): Promise<ReadableStream<Uint8Array>> {
	// Create a unique temporary directory for this request.
	const tempDir = await mkdtemp(join(tmpdir(), "meditation-"));
	const tempFiles: string[] = [];

	try {
		// 1. Create temporary files for all segments.
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			if (!segment) continue;

			if (segment.type === "text") {
				console.log(`📝 Generating text segment ${i + 1}: "${segment.content}"`);
				const tempFile = join(tempDir, `segment-${i}.mp3`);
				tempFiles.push(tempFile);
				const audioStream = await generateParagraphAudio(segment.content, {
					voice_id: "GUDYcgRAONiI1nXDcNQQ",
				});
				const audioBuffer = await streamToBuffer(audioStream);
				await writeFile(tempFile, audioBuffer);
			} else {
				console.log(`⏸️ Generating pause segment ${i + 1}: ${segment.duration}s`);
				// For a pause, add the silent audio file to the list for each second of duration.
				for (let j = 0; j < segment.duration; j++) {
					// We can just reference the same silent file multiple times.
					tempFiles.push(SILENT_AUDIO_PATH);
				}
			}
		}

		// 2. Create a file list for FFmpeg's concat demuxer.
		const fileListPath = join(tempDir, "filelist.txt");
		const fileListContent = tempFiles
			.map((file) => `file '${file.replace(/'/g, "'\\''")}'`)
			.join("\n");
		await writeFile(fileListPath, fileListContent);
		console.log("📄 Generated FFmpeg file list for concatenation.");

		// 3. Use FFmpeg to concatenate the files and stream the output.
		const outputStream = new PassThrough();
		ffmpeg()
			.input(fileListPath)
			.inputOptions(["-f concat", "-safe 0"])
			.audioCodec("copy") // Use "copy" to avoid re-encoding and ensure stability.
			.format("mp3")
			.on("error", (err) => {
				console.error("FFmpeg error during concatenation:", err);
				outputStream.emit("error", err);
			})
			.pipe(outputStream);

		// 4. Return the final stream and set up cleanup.
		const finalStream = new ReadableStream<Uint8Array>({
			start(controller) {
				let isControllerClosed = false;
				
				const closeController = () => {
					if (!isControllerClosed) {
						isControllerClosed = true;
						controller.close();
					}
				};
				
				const errorController = (err: Error) => {
					if (!isControllerClosed) {
						isControllerClosed = true;
						controller.error(err);
					}
				};
				
				outputStream.on("data", (chunk) => {
					if (!isControllerClosed) {
						try {
							controller.enqueue(chunk);
						} catch (err) {
							console.error("Error enqueueing chunk:", err);
							errorController(err as Error);
						}
					}
				});
				
				outputStream.on("end", () => {
					console.log("✅ Concatenation finished.");
					closeController();
				});
				
				outputStream.on("error", (err) => {
					console.error("FFmpeg output stream error:", err);
					errorController(err);
				});
			},
		});
		
		// Clean up the temp directory once the stream is closed or errors out.
		const cleanupOnce = () => cleanup(tempDir, false);
		outputStream.once("close", cleanupOnce);
		outputStream.once("error", cleanupOnce);

		return finalStream;

	} catch (error) {
		console.error("Error in meditation generation pipeline:", error);
		await cleanup(tempDir, true); // Clean everything on pipeline error
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
async function cleanup(dir: string, includeSelf: boolean) {
	try {
		const files = await require("fs/promises").readdir(dir);
		for (const file of files) {
			if (file.startsWith("segment-") || file === "filelist.txt") {
				await unlink(join(dir, file));
			}
		}
		if (includeSelf) {
			await require("fs/promises").rmdir(dir);
		}
		console.log(`🗑️ Cleaned up temporary files in: ${dir}`);
	} catch (err) {
		console.error(`🧹 Failed to clean up temporary directory ${dir}:`, err);
	}
}

export { generateConcatenatedMeditation }; 