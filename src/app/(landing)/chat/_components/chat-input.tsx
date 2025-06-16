"use client";

import { Ban, User, SendHorizonal, Brain, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AskRegistrationDrawerContent, CustomDrawer } from "./custom-drawer";
import { useDrawer, useChatState } from "./provider";
import { MeditationPanel, type MeditationParams } from "./meditation-panel";
import { cn } from "~/lib/utils";

interface ChatInputProps {
	onChatFocus?: (() => void) | undefined;
}

export function ChatInput({ onChatFocus }: ChatInputProps) {
	const {
		chat: { messages, input, handleInputChange, handleSubmit, status, stop, setInput },
		meditationMode,
		setMeditationMode,
		addCustomMessage,
		isGeneratingMeditation,
		setIsGeneratingMeditation,
	} = useChatState();

	const [isExpanded, setIsExpanded] = useState(false);

	const isLoading = useMemo(
		() => status === "streaming" || status === "submitted" || isGeneratingMeditation,
		[status, isGeneratingMeditation],
	);

	const { isOpen, toggleDrawer } = useDrawer();

	const getVoiceId = (gender: 'male' | 'female'): string => {
		return gender === 'female' ? 'g6xIsTj2HwM6VR4iXFCw' : 'GUDYcgRAONiI1nXDcNQQ';
	};

	const generatePrompt = (params: MeditationParams): string => {
		const guidanceInstructions = {
			beginner: "Provide detailed, step-by-step guidance.",
			confirmed: "Provide balanced guidance.",
			expert: "Provide minimal guidance, with long pauses."
		};
		const goalInstructions = {
			morning: "Create an energizing morning meditation.",
			focus: "Create a concentration meditation.",
			calm: "Create a calming meditation.",
			sleep: "Create a sleep meditation."
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
			const response = await fetch('/api/meditation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prompt,
					duration: params.duration,
					voiceId,
					background: params.background,
					guidance: params.guidance,
				}),
			});

			if (!response.ok) throw new Error(await response.text());
			
			const audioBlob = await response.blob();
			if (audioBlob.size === 0) throw new Error('Received empty audio file');
			
			const audioUrl = URL.createObjectURL(audioBlob);

			addCustomMessage({
				id: `meditation-${Date.now()}`,
				content: `Here is your personalized meditation.`,
				role: "assistant",
				audioUrl,
			});

		} catch (error) {
			console.error('Error generating meditation:', error);
			addCustomMessage({
				id: `error-${Date.now()}`,
				content: "Sorry, I couldn't generate your meditation. Please try again.",
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
		setInput('');

		setIsGeneratingMeditation(true);

		addCustomMessage({ id: `user-${Date.now()}`, content: currentInput, role: "user" });
		const loadingId = `loading-${Date.now()}`;
		addCustomMessage({ id: loadingId, content: "🧘‍♀️ Generating your personalized meditation from prompt...", role: "assistant" });

		try {
			const response = await fetch('/api/meditation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: currentInput }),
			});

			if (!response.ok) throw new Error(await response.text());
			
			const audioBlob = await response.blob();
			if (audioBlob.size === 0) throw new Error('Received empty audio file');
			
			const audioUrl = URL.createObjectURL(audioBlob);

			addCustomMessage({
				id: `meditation-${Date.now()}`,
				content: `Here's your meditation based on your prompt.`,
				role: "assistant",
				audioUrl,
			});
		} catch (error) {
			console.error('Error generating meditation from prompt:', error);
			addCustomMessage({ id: `error-${Date.now()}`, content: "Sorry, I couldn't generate from your prompt.", role: "assistant" });
		} finally {
			setIsGeneratingMeditation(false);
		}
	};
	
	const finalHandleSubmit = meditationMode ? handleMeditationSubmitFromInput : handleSubmit;

	return (
		<>
			<div className="mb-16">
				<CustomDrawer isOpen={isOpen}>
					<AskRegistrationDrawerContent onClose={() => useDrawer().closeDrawer()} />
				</CustomDrawer>
			</div>
			
			<div className={cn(
				"fixed right-1/2 bottom-0 z-10 w-full max-w-xl translate-x-1/2 self-center transition-all duration-500 ease-in-out",
				meditationMode ? "pb-[20px]" : "pb-0" // Padding to lift input bar
			)}>
				<div className={cn(
					"transition-all duration-500 ease-in-out overflow-hidden",
					meditationMode ? (isExpanded ? "h-[500px]" : "h-[250px]") : "h-0"
				)}>
					<div className="pt-4 px-4">
						<MeditationPanel 
							onGenerate={handleMeditationGenerate}
							isGenerating={isGeneratingMeditation}
							isExpanded={isExpanded}
							toggleExpand={() => setIsExpanded(!isExpanded)}
						/>
					</div>
				</div>

				<div className="bg-gradient-to-r from-white/90 to-orange-100/90 p-4 backdrop-blur-md rounded-t-2xl">					<div className="flex items-center gap-3">
						{/* Bouton de connexion (ancien bouton drawer) */}
						<Link href="/auth">
							<Button
								type="button"
								size="icon"
								className="size-11 flex-shrink-0 rounded-full p-2 text-white bg-orange-500 hover:bg-orange-600 transition-all"
							>
								<User className="size-6" />
							</Button>
						</Link>

						{/* 
						// Ancien bouton drawer commenté
						<Button
							type="button"
							size="icon"
							className="size-11 flex-shrink-0 rounded-full p-2 text-white"
							onClick={toggleDrawer}
						>
							<User className="size-6" />
						</Button>
						*/}						{/* Bouton Méditation amélioré */}
						<div className="relative group">
							<Button
								onClick={() => {
									setMeditationMode(!meditationMode);
									if (meditationMode) setIsExpanded(false);
								}}
								size="icon"
								className={cn(
									"size-12 flex-shrink-0 rounded-full transition-all duration-300 shadow-lg border-2",
									meditationMode 
										? "bg-gradient-to-br from-orange-300 to-orange-500 border-orange-200 text-white shadow-orange-100 hover:from-orange-400 hover:to-orange-600 hover:shadow-xl hover:scale-105" 
										: "bg-gradient-to-br from-white to-orange-50 border-orange-200 text-orange-500 shadow-orange-100 hover:from-orange-50 hover:to-orange-100 hover:border-orange-300 hover:shadow-xl hover:scale-105"
								)}
							>
								<Brain className={cn(
									"transition-all duration-300",
									meditationMode ? "size-7" : "size-6"
								)} />
							</Button>
							
							{/* Indicateur de statut élégant */}
							{meditationMode && (
								<div className="absolute -top-1 -right-1 size-4 bg-gradient-to-br from-orange-200 to-orange-400 rounded-full border-2 border-white shadow-sm">
									<div className="size-full bg-gradient-to-br from-orange-100 to-orange-300 rounded-full animate-pulse opacity-75"></div>
								</div>
							)}
							
							{/* Tooltip personnalisé qui apparaît au hover */}
							<div className={cn(
								"absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg transition-all duration-200 whitespace-nowrap shadow-lg",
								"before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-gray-700",
								"opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform group-hover:-translate-y-1"
							)}>
								{meditationMode ? "Mode Chat" : "Mode Méditation"}
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
								className="h-14 w-full rounded-full border-none bg-white pr-14 pl-5 text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 md:text-md"
							/>

							<Button
								disabled={isLoading || (!meditationMode && input.length === 0)}
								type="submit"
								size="icon"
								className="-translate-y-1/2 absolute top-1/2 right-1.5 z-10 size-11 rounded-full p-2 text-white transition-all duration-300"
								style={{
									backgroundColor: meditationMode ? '#f97316' : '#3b82f6',
								}}
							>
								{isLoading ? (
									<Ban className="size-6 animate-spin" />
								) : meditationMode ? (
									<Sparkles className="size-6" />
								) : (
									<SendHorizonal className="size-6" />
								)}
							</Button>
						</form>
					</div>
				</div>
			</div>
		</>
	);
}
