import { PassThrough } from "node:stream";
import ffmpeg from "fluent-ffmpeg";

function generateSilentMp3(duration: number) {
	// Input validation
	if (typeof duration !== "number" || Number.isNaN(duration)) {
		throw new Error("Duration must be a number");
	}
	if (duration < 0) {
		throw new Error("Duration must be a positive number");
	}
	if (duration === 0) {
		return new ReadableStream<Uint8Array>({
			start(controller) {
				controller.close();
			},
		});
	}

	const passThrough = new PassThrough();

	ffmpeg()
		.complexFilter([`anullsrc=r=44100:cl=stereo [a]; [a] atrim=0:${duration}`]) // Generate silence properly
		.audioCodec("libmp3lame") // Encode to MP3
		.audioBitrate(128) // Set bitrate
		.audioFrequency(44100) // Set sample rate
		.format("mp3") // Output as MP3
		.pipe(passThrough); // Pipe the output to a stream

	return new ReadableStream<Uint8Array>({
		start(controller) {
			passThrough.on("data", (chunk) =>
				controller.enqueue(new Uint8Array(chunk)),
			);
			passThrough.on("end", () => controller.close());
			passThrough.on("error", (err) => controller.error(err));
		},
		cancel() {
			passThrough.destroy();
		},
	});
}

export { generateSilentMp3 };
