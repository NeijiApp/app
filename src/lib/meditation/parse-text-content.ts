import { parseDuration } from "../../utils/parse-duration";

/**
 * parseTextContent(stream):
 *   Reads a ReadableStream<Uint8Array> of text,
 *   yields either:
 *     - string  (accumulated text),
 *     - number  (pause in seconds).
 *
 *   Requirements:
 *     - If text is split across multiple chunks, accumulate it until we see a
 *       pause directive (or end of stream).
 *     - If a pause directive "[pause: X]" is split across chunks, wait until
 *       the entire directive is available before parsing.
 */
export async function* parseTextContent(stream: ReadableStream<Uint8Array>) {
	const reader = stream.getReader();
	const decoder = new TextDecoder();

	// We'll keep leftover data in `buffer`
	// plus an `accumulatedText` to store text we haven't yielded yet.
	let buffer = "";
	let accumulatedText = "";

	while (true) {
		const { value, done } = await reader.read();
		if (done) {
			// No more data from the stream: yield whatever text remains
                        accumulatedText += buffer;
                        if (accumulatedText) {
                                yield accumulatedText;
                        }
			break;
		}

		// Decode this chunk and append it to our buffer
		buffer += decoder.decode(value, { stream: true });

		// Keep parsing while we can find a full "[pause X]" inside the buffer
                while (true) {
                        // 1) Find the start of a pause directive ("[pause" or "[pause:")
                        const startIndex = buffer.indexOf("[pause");
			if (startIndex === -1) {
				// No (further) "[pause " in the buffer: can't parse a directive here
				// We'll wait for more data or end-of-stream
				break;
			}

			// 2) Look for the closing ']' after "[pause "
                        const endIndex = buffer.indexOf("]", startIndex);
                        if (endIndex === -1) {
                                // We have a partial directive like "[pause 3" or "[pause: 3"
                                // Wait for more data in next chunk
                                break;
                        }

                        // 3) We found a complete pause directive, e.g. "[pause 3]" or "[pause: 3s]"
                        //    - Everything before `startIndex` is text to yield
			const textBefore = buffer.slice(0, startIndex);
			accumulatedText += textBefore;

                        if (accumulatedText) {
                                // Yield the text we've accumulated so far, then reset it
                                yield accumulatedText;
                                accumulatedText = "";
                        }

			// 4) Extract the pause directive content: e.g. "[pause 3]"
                        const directive = buffer.slice(startIndex, endIndex + 1);
                        // Example: "[pause: 3s]" or "[pause 3]"
                        const match = directive.match(/\[pause[:\s]+([^\]]+)\]/i);
                        if (match && match[1]) {
                                const seconds = parseDuration(match[1]);
                                yield seconds; // yield the numeric pause
                        }

			// 5) Remove the consumed portion from `buffer`
			buffer = buffer.slice(endIndex + 1);
		}
	}
}
