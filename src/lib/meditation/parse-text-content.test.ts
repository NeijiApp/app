import { expect, it } from "bun:test";
import { parseTextContent } from "./parse-text-content";

/**
 * Helper to turn an array of strings into a ReadableStream<Uint8Array>.
 * Each array entry is encoded into Uint8Array, and fed as a chunk.
 */
function arrayToReadableStream(chunks: string[]) {
	let currentIndex = 0;

	return new ReadableStream({
		pull(controller) {
			if (currentIndex < chunks.length) {
				// Encode the chunk as UTF-8
				const encoded = new TextEncoder().encode(chunks[currentIndex]);
				controller.enqueue(encoded);
				currentIndex++;
			} else {
				controller.close();
			}
		},
	});
}

it("yields only string and number (simple case)", async () => {
	// Suppose we have 2 paragraphs, then a pause, then another paragraph, then a pause
	const chunks = [
		"Hello world. [pause: 3s]More text. ",
		"[pause: 2m] Final text.",
	];
	const stream = arrayToReadableStream(chunks);

	const results = [];
	for await (const item of parseTextContent(stream)) {
		results.push(item);
	}

	// We expect something like:
	//  1) "Hello world. "
	//  2) 3     (pause in seconds)
	//  3) "More text. "
	//  4) 120   (2m -> 120 seconds)
	//  5) " Final text."
	expect(results).toEqual([
		"Hello world. ",
		3,
		"More text. ",
		120,
		" Final text.",
	]);

	// Double-check types: string, number, string, number, string
	expect(typeof results[0]).toBe("string");
	expect(typeof results[1]).toBe("number");
	expect(typeof results[2]).toBe("string");
	expect(typeof results[3]).toBe("number");
	expect(typeof results[4]).toBe("string");
});

it("accumulates paragraph text split in chunks until next pause", async () => {
	// Here "Hello world." is chunked into two pieces.
	// The parser should eventually yield it as one string,
	// because there's no pause directive in between.
	const chunks = ["Hello ", "world. [pause: 5s]", "Another paragraph."];
	const stream = arrayToReadableStream(chunks);

	const results = [];
	for await (const item of parseTextContent(stream)) {
		results.push(item);
	}

	// Expect the text "Hello world. " to be combined into one yield
	// up until we encounter [pause: 5s].
	expect(results).toEqual([
		"Hello world. ", // (combined from the first two chunk pieces before the pause token)
		5,
		"Another paragraph.",
	]);
});

it("waits for a split pause directive that is cut in half", async () => {
	// The pause directive "[pause: 10s]" is deliberately split across two chunks:
	//  "[pause: " in the first chunk, "10s]" in the second chunk.
	// The parser should wait until it has the full directive.
	const chunks = ["Intro text [pa", "use: 10s] followed by more."];
	const stream = arrayToReadableStream(chunks);

	const results = [];
	for await (const item of parseTextContent(stream)) {
		results.push(item);
	}

	// We expect:
	//   "Intro text "  (text outside the partial pause)
	//   10            (parsed from '10s')
	//   " followed by more."
	expect(results).toEqual(["Intro text ", 10, " followed by more."]);
});
