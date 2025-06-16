import { OpenAI } from "openai";

if (!process.env.OPENROUTER_API_KEY) {
	throw new Error("The environement variable OPENROUTER_API_KEY is not set");
}

export const openai = new OpenAI({
	baseURL: "https://openrouter.ai/api/v1",
	apiKey: process.env.OPENROUTER_API_KEY,
});
