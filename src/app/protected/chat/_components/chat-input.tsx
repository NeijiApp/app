"use client";

<<<<<<< HEAD
import { Ban, Brain, SendHorizonal, Sparkles } from "lucide-react";
=======
import { Ban, SendHorizonal, Brain, Sparkles, User } from "lucide-react";
>>>>>>> origin/cursor/refactor-chat-ui-for-consistency-and-responsiveness-b6f1
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
<<<<<<< HEAD

			{/* Meditation Panel - drawer that slides up from behind input bar */}
			<div
				className={cn(
					"fixed right-1/2 bottom-18 z-5 w-full max-w-xl translate-x-1/2 transition-all duration-300 ease-in-out",
					meditationMode
						? isExpanded
							? "h-[70vh]"
							: "h-[40vh]"
						: "h-0",
=======
			
			{/* Meditation drawer overlay */}
			<div
				className={cn(
					"fixed right-1/2 bottom-[92px] z-5 w-full max-w-xl translate-x-1/2 transition-all duration-300 ease-in-out",
					meditationMode ? (isExpanded ? "h-[min(70dvh,calc(100dvh-140px))]" : "h-[min(45dvh,calc(100dvh-140px))]") : "h-0",
>>>>>>> origin/cursor/refactor-chat-ui-for-consistency-and-responsiveness-b6f1
				)}
			>
				<div className="h-full overflow-hidden">
					<div className="h-full overflow-y-auto px-4 py-4">
<<<<<<< HEAD
						<MeditationPanel
=======
						<MeditationPanel 
>>>>>>> origin/cursor/refactor-chat-ui-for-consistency-and-responsiveness-b6f1
							onGenerate={handleMeditationGenerate}
							isGenerating={isGeneratingMeditation}
							isExpanded={isExpanded}
							toggleExpand={() => setIsExpanded(!isExpanded)}
						/>
					</div>
				</div>
			</div>
<<<<<<< HEAD
			
			{/* Input Bar - positioned at bottom */}
			<div className="fixed right-1/2 bottom-0 z-10 w-full max-w-xl translate-x-1/2 self-center">
				<div className="rounded-t-2xl bg-gradient-to-r from-white/90 to-orange-100/90 p-4 backdrop-blur-md shadow-lg">
					{" "}
					<div className="flex items-center gap-3">
						{" "}
						{/* Bouton Méditation amélioré */}
						<div className="group relative">
							{" "}
							<Button
								onClick={() => {
									setMeditationMode(!meditationMode);
									if (meditationMode) setIsExpanded(false);
								}}
								size="icon"
								className={cn(
									"size-12 flex-shrink-0 rounded-full border-2 shadow-lg transition-all duration-300",
									meditationMode
										? "border-orange-200 bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-100 hover:scale-105 hover:from-orange-400 hover:to-orange-600 hover:shadow-xl"
										: "border-orange-200 bg-gradient-to-br from-white to-orange-50 text-orange-500 shadow-orange-100 hover:scale-105 hover:border-orange-300 hover:from-orange-50 hover:to-orange-100 hover:shadow-xl",
								)}
							>
								<Brain
									className={cn(
										"transition-all duration-300",
										meditationMode ? "size-7" : "size-6",
									)}
								/>
							</Button>
							{/* Indicateur de statut élégant */}
							{meditationMode && (
								<div className="-top-1 -right-1 absolute size-4 rounded-full border-2 border-white bg-gradient-to-br from-orange-200 to-orange-400 shadow-sm">
									<div className="size-full animate-pulse rounded-full bg-gradient-to-br from-orange-100 to-orange-300 opacity-75"></div>
								</div>
							)}
							{/* Tooltip personnalisé qui apparaît au hover */}
							<div
								className={cn(
									"-top-12 -translate-x-1/2 absolute left-1/2 whitespace-nowrap rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white shadow-lg transition-all duration-200",
									"before:-translate-x-1/2 before:absolute before:top-full before:left-1/2 before:border-4 before:border-transparent before:border-t-gray-700",
									"group-hover:-translate-y-1 pointer-events-none transform opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
								)}
							>
								{meditationMode ? "Mode Chat" : "Mode Méditation"}
							</div>
						</div>
=======

			{/* Input bar */}
			<div className="fixed right-1/2 bottom-0 z-10 w-full max-w-xl translate-x-1/2 self-center">
				<div className="rounded-t-2xl bg-white/85 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md md:p-4">
					<div className="flex items-center gap-3">
						<Button
							onClick={() => { setMeditationMode(!meditationMode); if (meditationMode) setIsExpanded(false); }}
							size="icon"
							variant={meditationMode ? "orange" : "orangeOutline"}
							className="size-12 rounded-full"
						>
							<Brain className={cn("transition-all duration-300", meditationMode ? "size-7" : "size-6")} />
						</Button>

						{meditationMode && (
							<div className="relative -ml-2 mr-1 inline-block align-middle">
								<div className="absolute -right-1 -top-1 size-4 rounded-full border-2 border-white bg-orange-400">
									<div className="size-full animate-pulse rounded-full bg-orange-300/70" />
								</div>
							</div>
						)}

>>>>>>> origin/cursor/refactor-chat-ui-for-consistency-and-responsiveness-b6f1
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

<<<<<<< HEAD
							<Button
								disabled={isLoading || (!meditationMode && input.length === 0)}
								type="submit"
								size="icon"
								className="-translate-y-1/2 absolute top-1/2 right-1.5 z-10 size-11 rounded-full p-2 text-white transition-all duration-300"
								style={{
									backgroundColor: meditationMode ? "#f97316" : "#3b82f6",
								}}
							>
=======
							<div className="absolute right-3 top-1/2 -translate-y-1/2">
>>>>>>> origin/cursor/refactor-chat-ui-for-consistency-and-responsiveness-b6f1
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
