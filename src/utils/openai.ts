import OpenAI from "openai";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
