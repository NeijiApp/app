import { expect, it, jest, mock } from "bun:test";

import { generateSilentMp3 } from "./generate-silence-mp3";

// Create a mock that can be modified per test
const mockFfmpeg = jest.fn(() => ({
	setFfmpegPath: jest.fn().mockReturnThis(),
	complexFilter: jest.fn().mockReturnThis(),
	audioCodec: jest.fn().mockReturnThis(),
	audioBitrate: jest.fn().mockReturnThis(),
	audioFrequency: jest.fn().mockReturnThis(),
	format: jest.fn().mockReturnThis(),
	pipe: jest.fn((stream) => {
		process.nextTick(() => {
			stream.emit("data", Buffer.from([0x00, 0x01, 0x02]));
			stream.emit("end");
		});
		return stream;
	}),
}));

mock.module("fluent-ffmpeg", () => mockFfmpeg);

it("should return a valid ReadableStream", async () => {
	const stream = generateSilentMp3(5);
	expect(stream).toBeInstanceOf(ReadableStream);
});

it("should generate silent MP3 of given duration", async () => {
	const duration = 3;
	const stream = generateSilentMp3(duration);
	const reader = stream.getReader();

	let totalChunks = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		totalChunks += value.length;
	}

	expect(totalChunks).toBeGreaterThan(0); // Should produce MP3 data
});

it("should handle zero duration", async () => {
	const stream = generateSilentMp3(0);
	const reader = stream.getReader();
	const { done } = await reader.read();
	expect(done).toBe(true);
	await reader.cancel();
});

it("should handle short durations", async () => {
	const stream = generateSilentMp3(0.5);
	const reader = stream.getReader();
	const { done } = await reader.read();
	expect(done).toBe(false);
});

it("should handle large durations", async () => {
	const duration = 3600; // 1 hour
	const stream = generateSilentMp3(duration);
	expect(stream).toBeInstanceOf(ReadableStream);
});

it("should throw an error for negative duration", () => {
	expect(() => generateSilentMp3(-5)).toThrow();
});

it("should throw an error for non-numeric duration", () => {
	expect(() => generateSilentMp3(Number.NaN)).toThrow();
	expect(() => generateSilentMp3("five" as unknown as number)).toThrow();
	expect(() => generateSilentMp3(undefined as unknown as number)).toThrow();
});
