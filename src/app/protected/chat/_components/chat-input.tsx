"use client";

import { Ban, Brain, SendHorizonal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AskRegistrationDrawerContent, CustomDrawer } from "./custom-drawer";
import { MeditationPanel, type MeditationParams } from "./meditation-panel";
import { useChatState, useDrawer } from "./provider";

import { cn } from "~/lib/utils";

interface ChatInputProps {
	onChatFocus?: (() => void) | undefined;
}

export function ChatInput({ onChatFocus }: ChatInputProps) {
	const {
		chat: {
			messages,
			input,
			handleInputChange,
			handleSubmit,
			status,
			stop,
			setInput,
		},
		meditationMode,
		setMeditationMode,
		addCustomMessage,
		isGeneratingMeditation,
		setIsGeneratingMeditation,
	} = useChatState();

	const [isExpanded, setIsExpanded] = useState(false);

	const isLoading = useMemo(
		() =>
			status === "streaming" ||
			status === "submitted" ||
			isGeneratingMeditation,
		[status, isGeneratingMeditation],
	);

	const { isOpen, toggleDrawer } = useDrawer();

	const getVoiceId = (gender: "male" | "female"): string => {
		return gender === "female"
			? "g6xIsTj2HwM6VR4iXFCw"
			: "GUDYcgRAONiI1nXDcNQQ";
	};

	const generatePrompt = (params: MeditationParams): string => {
		const guidanceInstructions = {
			beginner: "Provide detailed, step-by-step guidance.",
			confirmed: "Provide balanced guidance.",
			expert: "Provide minimal guidance, with long pauses.",
		};
		const goalInstructions = {
			morning: "Create an energizing morning meditation.",
			focus: "Create a concentration meditation.",
			calm: "Create a calming meditation.",
			sleep: "Create a sleep meditation.",
		};
		return `Create a ${params.duration}-minute ${params.goal} meditation. ${goalInstructions[params.goal]} ${guidanceInstructions[params.guidance]} Use a ${params.gender} voice.`;
	};

	const handleMeditationGenerate = async (params: MeditationParams) => {
		setIsGeneratingMeditation(true);

		const prompt = generatePrompt(params);
		const voiceId = getVoiceId(params.gender);

		addCustomMessage({
			id: `user-${Date.now()}`,
			content: `Generate: ${params.duration}m, ${params.goal}, ${params.guidance}, ${params.gender}, ${params.background} bg`,
			role: "user",
		});

		const loadingId = `loading-${Date.now()}`;
		addCustomMessage({
			id: loadingId,
			content: "🧘‍♀️ Generating your personalized meditation...",
			role: "assistant",
		});

		try {
			const response = await fetch("/api/meditation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt,
					duration: params.duration,
					voiceId,
					gender: params.gender,
					background: params.background,
					guidance: params.guidance,
					goal: params.goal,
				}),
			});

			if (!response.ok) throw new Error(await response.text());

			const audioBlob = await response.blob();
			if (audioBlob.size === 0) throw new Error("Received empty audio file");

			const audioUrl = URL.createObjectURL(audioBlob);

			addCustomMessage({
				id: `meditation-${Date.now()}`,
				content: `Here is your personalized meditation.`,
				role: "assistant",
				audioUrl,
			});
		} catch (error) {
			console.error("Error generating meditation:", error);
			addCustomMessage({
				id: `error-${Date.now()}`,
				content:
					"Sorry, I couldn't generate your meditation. Please try again.",
				role: "assistant",
			});
		} finally {
			setIsGeneratingMeditation(false);
		}
	};

	const handleMeditationSubmitFromInput = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		const currentInput = input;
		setInput("");

		setIsGeneratingMeditation(true);

		addCustomMessage({
			id: `user-${Date.now()}`,
			content: currentInput,
			role: "user",
		});
		const loadingId = `loading-${Date.now()}`;
		addCustomMessage({
			id: loadingId,
			content: "🧘‍♀️ Generating your personalized meditation from prompt...",
			role: "assistant",
		});

		try {
			// Use default meditation parameters when generating from prompt
			const defaultVoiceId = getVoiceId("female"); // Default to female voice
			const response = await fetch("/api/meditation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: currentInput,
					voiceId: defaultVoiceId,
					gender: "female",
					duration: 5,
					background: "silence",
					guidance: "confirmed",
					goal: "calm",
				}),
			});

			if (!response.ok) throw new Error(await response.text());

			const audioBlob = await response.blob();
			if (audioBlob.size === 0) throw new Error("Received empty audio file");

			const audioUrl = URL.createObjectURL(audioBlob);

			addCustomMessage({
				id: `meditation-${Date.now()}`,
				content: `Here's your meditation based on your prompt.`,
				role: "assistant",
				audioUrl,
			});
		} catch (error) {
			console.error("Error generating meditation from prompt:", error);
			addCustomMessage({
				id: `error-${Date.now()}`,
				content: "Sorry, I couldn't generate from your prompt.",
				role: "assistant",
			});
		} finally {
			setIsGeneratingMeditation(false);
		}
	};

	const finalHandleSubmit = meditationMode
		? handleMeditationSubmitFromInput
		: handleSubmit;

	return (
		<>
			<div className="mb-16">
				<CustomDrawer isOpen={isOpen}>
					<AskRegistrationDrawerContent
						onClose={() => useDrawer().closeDrawer()}
					/>
				</CustomDrawer>
			</div>

				)}
			>
				<div className="h-full overflow-hidden">
					<div className="h-full overflow-y-auto px-4 py-4">

							onGenerate={handleMeditationGenerate}
							isGenerating={isGeneratingMeditation}
							isExpanded={isExpanded}
							toggleExpand={() => setIsExpanded(!isExpanded)}
						/>
					</div>
				</div>
			</div>

						<form onSubmit={finalHandleSubmit} className="relative flex-1">
							<Input
								disabled={isLoading}
								type="text"
								value={input}
								onChange={handleInputChange}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										finalHandleSubmit(e as any);
									}
								}}
								onFocus={onChatFocus}
								placeholder={
									meditationMode
										? "Describe your meditation..."
										: messages.length === 0
											? "Ask Neiji"
											: "Message"
								}
								className="h-12 w-full rounded-full border-orange-200 bg-white/80 pl-6 pr-14 text-base transition-all focus:bg-white focus:ring-2 focus:ring-orange-300"
							/>


								{isLoading ? (
									<Button type="button" size="icon" variant="orangeOutline" onClick={stop} className="size-9 rounded-full">
										<Ban className="size-5 animate-spin" />
									</Button>
								) : (
									<Button type="submit" size="icon" variant="orange" className="size-9 rounded-full" disabled={!input.trim()}>
										{meditationMode ? <Sparkles className="size-5" /> : <SendHorizonal className="size-5" />}
									</Button>
								)}
							</div>
						</form>
					</div>
				</div>
			</div>
		</>
	);
}
