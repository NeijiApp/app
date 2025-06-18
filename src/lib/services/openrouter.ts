import { OpenAI } from "openai";
import { env } from "~/env.js";

let _openai: OpenAI | null = null;

function getOpenRouterClient(): OpenAI {
	if (_openai) {
		return _openai;
	}
	
	// Since OPENROUTER_API_KEY is optional in env schema, check if it exists
	if (!env.OPENROUTER_API_KEY) {
		throw new Error("The environment variable OPENROUTER_API_KEY is not set. Please set it in your .env.local file.");
	}
	
	_openai = new OpenAI({
		baseURL: "https://openrouter.ai/api/v1",
		apiKey: env.OPENROUTER_API_KEY,
	});
	
	return _openai;
}

export const openai = {
	chat: {
		completions: {
			create: (...args: Parameters<OpenAI['chat']['completions']['create']>) => {
				return getOpenRouterClient().chat.completions.create(...args);
			}
		}
	}
};
