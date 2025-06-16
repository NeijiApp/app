function injectDataToSystemPrompt({
	template_system_prompt,
	duration = 2,
}: {
	readonly template_system_prompt: string;
	readonly duration?: number | undefined;
}) {
	return template_system_prompt.replaceAll("%duration", duration.toString());
}

export { injectDataToSystemPrompt };
