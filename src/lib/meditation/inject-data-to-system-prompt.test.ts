import { expect, it } from "bun:test";

import { injectDataToSystemPrompt } from "./inject-data-to-system-prompt";

it("should replace %duration with default value (2)", () => {
	const input = "Duration is %duration seconds.";
	const result = injectDataToSystemPrompt({ template_system_prompt: input });
	expect(result).toBe("Duration is 2 seconds.");
});

it("should replace %duration with provided value (5)", () => {
	const input = "Duration is %duration seconds.";
	const result = injectDataToSystemPrompt({
		template_system_prompt: input,
		duration: 5,
	});
	expect(result).toBe("Duration is 5 seconds.");
});

it("should return the same string if %duration is not present", () => {
	const input = "No duration here.";
	const result = injectDataToSystemPrompt({
		template_system_prompt: input,
		duration: 10,
	});
	expect(result).toBe("No duration here.");
});

it("should handle negative duration values", () => {
	const input = "Duration is %duration seconds.";
	const result = injectDataToSystemPrompt({
		template_system_prompt: input,
		duration: -3,
	});
	expect(result).toBe("Duration is -3 seconds.");
});

it("should replace %duration with decimal value", () => {
	const input = "Duration is %duration seconds.";
	const result = injectDataToSystemPrompt({
		template_system_prompt: input,
		duration: 2.5,
	});
	expect(result).toBe("Duration is 2.5 seconds.");
});

it("should support large numeric values", () => {
	const input = "Duration is %duration seconds.";
	const result = injectDataToSystemPrompt({
		template_system_prompt: input,
		duration: 1000000,
	});
	expect(result).toBe("Duration is 1000000 seconds.");
});

it("should return empty string if the template is empty", () => {
	const input = "";
	const result = injectDataToSystemPrompt({ template_system_prompt: input });
	expect(result).toBe("");
});

it("should replace multiple occurrences of %duration", () => {
	const input = "The %duration will take %duration minutes.";
	const result = injectDataToSystemPrompt({
		template_system_prompt: input,
		duration: 7,
	});
	expect(result).toBe("The 7 will take 7 minutes.");
});

it("should only replace exact %duration and leave similar words unchanged", () => {
	const input = "The duration is %duration and duration is important.";
	const result = injectDataToSystemPrompt({
		template_system_prompt: input,
		duration: 4,
	});
	expect(result).toBe("The duration is 4 and duration is important.");
});
