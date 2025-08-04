"use client";

import {
	ChevronsDown,
	ChevronsUp,
	Clock,
	Focus,
	GraduationCap,
	Moon,
	Play,
	RefreshCw,
	Sunrise,
	Target,
	User,
	Volume2,
	Waves,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export interface MeditationParams {
	duration: number;
	gender: "male" | "female";
	guidance: "beginner" | "confirmed" | "expert";
	background: "silence" | "waves" | "rain" | "focus" | "relax";
	goal: "morning" | "focus" | "calm" | "sleep";
}

interface MeditationPanelProps {
	onGenerate: (params: MeditationParams) => void;
	isGenerating: boolean;
	isExpanded: boolean;
	toggleExpand: () => void;
}

const DURATION_OPTIONS = [0.5, 2, 3, 5, 7, 10];
const GENDER_OPTIONS = [
	{
		value: "female" as const,
		label: "Female",
		voiceId: "g6xIsTj2HwM6VR4iXFCw",
	},
	{ value: "male" as const, label: "Male", voiceId: "GUDYcgRAONiI1nXDcNQQ" },
];
const GUIDANCE_OPTIONS = [
	{
		value: "beginner" as const,
		label: "Beginner",
		description: "Detailed guidance",
	},
	{
		value: "confirmed" as const,
		label: "Confirmed",
		description: "Balanced guidance",
	},
	{
		value: "expert" as const,
		label: "Expert",
		description: "Minimal guidance",
	},
];
const BACKGROUND_OPTIONS = [
	{ value: "silence" as const, label: "Silence", icon: Volume2 },
	{ value: "waves" as const, label: "Ocean Waves", icon: Waves },
	{ value: "rain" as const, label: "Rain", icon: Volume2 },
	{ value: "focus" as const, label: "Focus", icon: Focus },
	{ value: "relax" as const, label: "Relax", icon: Volume2 },
];
const GOAL_OPTIONS = [
	{
		value: "morning" as const,
		label: "Morning",
		icon: Sunrise,
		color: "bg-yellow-100 text-yellow-800",
	},
	{
		value: "focus" as const,
		label: "Focus",
		icon: Focus,
		color: "bg-blue-100 text-blue-800",
	},
	{
		value: "calm" as const,
		label: "Calm",
		icon: Target,
		color: "bg-green-100 text-green-800",
	},
	{
		value: "sleep" as const,
		label: "Sleep",
		icon: Moon,
		color: "bg-purple-100 text-purple-800",
	},
];

export function MeditationPanel({
	onGenerate,
	isGenerating,
	isExpanded,
	toggleExpand,
}: MeditationPanelProps) {
	const [params, setParams] = useState<MeditationParams>({
		duration: 5,
		gender: "female",
		guidance: "confirmed",
		background: "silence",
		goal: "calm",
	});
	const [isTestGenerating, setIsTestGenerating] = useState(false);
	const [currentTTSProvider, setCurrentTTSProvider] = useState<
		"openai" | "elevenlabs"
	>("elevenlabs");
	const [isSwitchingTTS, setIsSwitchingTTS] = useState(false);

	const handleGenerate = () => {
		onGenerate(params);
	};

	// Check current TTS provider on mount
	useEffect(() => {
		const checkTTSProvider = async () => {
			try {
				const response = await fetch("/api/tts");
				if (response.ok) {
					const data = await response.json();
					setCurrentTTSProvider(data.data.current);
				}
			} catch (error) {
				console.error("Failed to check TTS provider:", error);
			}
		};
		checkTTSProvider();
	}, []);

	const handleSwitchTTS = async () => {
		setIsSwitchingTTS(true);
		const newProvider =
			currentTTSProvider === "openai" ? "elevenlabs" : "openai";

		try {
			const response = await fetch("/api/tts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "switch",
					provider: newProvider,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				setCurrentTTSProvider(newProvider);
				console.log(`✅ Switched TTS to ${newProvider.toUpperCase()}`);
			}
		} catch (error) {
			console.error("Failed to switch TTS provider:", error);
		} finally {
			setIsSwitchingTTS(false);
		}
	};

	const handleTestGenerate = async () => {
		setIsTestGenerating(true);

		try {
			const response = await fetch("/api/test-meditation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					voiceId:
						params.gender === "male"
							? "GUDYcgRAONiI1nXDcNQQ"
							: "g6xIsTj2HwM6VR4iXFCw",
					gender: params.gender,
				}),
			});

			if (!response.ok) throw new Error(await response.text());

			const audioBlob = await response.blob();
			if (audioBlob.size === 0) throw new Error("Received empty audio file");

			const audioUrl = URL.createObjectURL(audioBlob);

			// Create audio element and play
			const audio = new Audio(audioUrl);
			audio.play();

			console.log("✅ Test meditation generated and playing!");
		} catch (error) {
			console.error("❌ Test meditation error:", error);
			alert("Test meditation failed. Check console for details.");
		} finally {
			setIsTestGenerating(false);
		}
	};

	const CompactView = () => (
		<div className="space-y-3 p-4 pb-2">
			{/* Quick Actions: Duration & Goal */}
			<div className="flex gap-2">
				<div className="grid flex-1 grid-cols-3 gap-1.5">
					{DURATION_OPTIONS.slice(0, 3).map((duration) => (
						<Tooltip key={duration} delayDuration={0}>
							<TooltipTrigger asChild>
								<Button
									key={duration}
									variant={params.duration === duration ? "default" : "outline"}
									size="sm"
									onClick={() => setParams((prev) => ({ ...prev, duration }))}
									className={cn(
										"h-9 min-w-[40px] text-xs",
										params.duration === duration
											? "bg-orange-500 text-white"
											: "border-orange-300 text-orange-700",
										duration === 0.5
											? "border-red-300 bg-red-100 text-red-700 hover:bg-red-200"
											: "",
									)}
								>
									{duration === 0.5 ? "TEST" : `${duration}m`}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									{duration === 0.5
										? "Test 30 secondes (temporaire)"
										: `${duration} minutes`}
								</p>
							</TooltipContent>
						</Tooltip>
					))}
				</div>
				<div className="grid flex-1 grid-cols-2 gap-1.5">
					{GENDER_OPTIONS.map((gender) => (
						<Tooltip key={gender.value} delayDuration={0}>
							<TooltipTrigger asChild>
								<Button
									variant={
										params.gender === gender.value ? "default" : "outline"
									}
									size="icon"
									onClick={() =>
										setParams((prev) => ({ ...prev, gender: gender.value }))
									}
									className={cn(
										"h-9 w-full",
										params.gender === gender.value
											? "bg-orange-500 text-white"
											: "border-orange-300 text-orange-700",
									)}
								>
									<User className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{gender.label} Voice</p>
							</TooltipContent>
						</Tooltip>
					))}
				</div>
			</div>
			<div className="grid flex-1 grid-cols-4 gap-1.5">
				{GOAL_OPTIONS.map((goal) => {
					const Icon = goal.icon;
					return (
						<Tooltip key={goal.value} delayDuration={0}>
							<TooltipTrigger asChild>
								<Button
									variant={params.goal === goal.value ? "default" : "outline"}
									size="icon"
									onClick={() =>
										setParams((prev) => ({ ...prev, goal: goal.value }))
									}
									className={cn(
										"h-9 w-full",
										params.goal === goal.value
											? "bg-orange-500 text-white"
											: "border-orange-300 text-orange-700",
									)}
								>
									<Icon className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{goal.label}</p>
							</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
		</div>
	);

	const ExpandedView = () => (
		<div className="space-y-4 p-4 pb-2">
			{/* Duration Selection */}
			<div className="space-y-2">
				<div className="flex items-center gap-2 font-medium text-sm text-orange-800">
					<Clock className="size-4" />
					Duration
				</div>
				<div className="grid grid-cols-3 gap-2">
					{DURATION_OPTIONS.map((duration) => (
						<Button
							key={duration}
							variant={params.duration === duration ? "default" : "outline"}
							size="sm"
							onClick={() => setParams((prev) => ({ ...prev, duration }))}
							className={cn(
								"h-8 text-xs",
								params.duration === duration
									? "bg-orange-500 text-white"
									: "border-orange-300 text-orange-700",
								duration === 0.5
									? "border-red-300 bg-red-100 text-red-700 hover:bg-red-200"
									: "",
							)}
						>
							{duration === 0.5 ? "TEST" : `${duration}m`}
						</Button>
					))}
				</div>
			</div>

			{/* Gender Selection */}
			<div className="space-y-2">
				<div className="flex items-center gap-2 font-medium text-sm text-orange-800">
					<User className="size-4" />
					Voice Gender
				</div>
				<div className="grid grid-cols-2 gap-2">
					{GENDER_OPTIONS.map((gender) => (
						<Button
							key={gender.value}
							variant={params.gender === gender.value ? "default" : "outline"}
							size="sm"
							onClick={() =>
								setParams((prev) => ({ ...prev, gender: gender.value }))
							}
							className={cn(
								"h-8 text-xs",
								params.gender === gender.value
									? "bg-orange-500 text-white"
									: "border-orange-300 text-orange-700",
							)}
						>
							{gender.label}
						</Button>
					))}
				</div>
			</div>

			{/* Guidance Level */}
			<div className="space-y-2">
				<div className="flex items-center gap-2 font-medium text-sm text-orange-800">
					<GraduationCap className="size-4" />
					Guidance Level
				</div>
				<div className="grid grid-cols-3 gap-2">
					{GUIDANCE_OPTIONS.map((guidance) => (
						<Button
							key={guidance.value}
							variant={
								params.guidance === guidance.value ? "default" : "outline"
							}
							size="sm"
							onClick={() =>
								setParams((prev) => ({ ...prev, guidance: guidance.value }))
							}
							className={cn(
								"flex h-12 flex-col items-center justify-center p-2 text-center",
								params.guidance === guidance.value
									? "bg-orange-500 text-white"
									: "border-orange-300 text-orange-700",
							)}
						>
							<span className="font-medium text-xs">{guidance.label}</span>
							<span className="text-[10px] opacity-70 leading-tight">{guidance.description}</span>
						</Button>
					))}
				</div>
			</div>

			{/* Background Sound */}
			<div className="space-y-2">
				<div className="flex items-center gap-2 font-medium text-sm text-orange-800">
					<Volume2 className="size-4" />
					Background Sound
				</div>
				<div className="grid grid-cols-3 gap-2">
					{BACKGROUND_OPTIONS.slice(0, 3).map((background) => {
						const Icon = background.icon;
						return (
							<Button
								key={background.value}
								variant={
									params.background === background.value ? "default" : "outline"
								}
								size="sm"
								onClick={() =>
									setParams((prev) => ({
										...prev,
										background: background.value,
									}))
								}
								className={cn(
									"flex h-10 flex-col items-center justify-center gap-1 p-2",
									params.background === background.value
										? "bg-orange-500 text-white"
										: "border-orange-300 text-orange-700",
								)}
							>
								<Icon className="size-3" />
								<span className="text-[10px]">{background.label}</span>
							</Button>
						);
					})}
				</div>
				<div className="grid grid-cols-2 gap-2">
					{BACKGROUND_OPTIONS.slice(3).map((background) => {
						const Icon = background.icon;
						return (
							<Button
								key={background.value}
								variant={
									params.background === background.value ? "default" : "outline"
								}
								size="sm"
								onClick={() =>
									setParams((prev) => ({
										...prev,
										background: background.value,
									}))
								}
								className={cn(
									"flex h-10 flex-col items-center justify-center gap-1 p-2",
									params.background === background.value
										? "bg-orange-500 text-white"
										: "border-orange-300 text-orange-700",
								)}
							>
								<Icon className="size-3" />
								<span className="text-[10px]">{background.label}</span>
							</Button>
						);
					})}
				</div>
			</div>

			{/* Goal Selection */}
			<div className="space-y-2">
				<div className="flex items-center gap-2 font-medium text-sm text-orange-800">
					<Target className="size-4" />
					Meditation Goal
				</div>
				<div className="grid grid-cols-2 gap-2">
					{GOAL_OPTIONS.map((goal) => {
						const Icon = goal.icon;
						return (
							<Button
								key={goal.value}
								variant={params.goal === goal.value ? "default" : "outline"}
								size="sm"
								onClick={() =>
									setParams((prev) => ({ ...prev, goal: goal.value }))
								}
								className={cn(
									"flex h-10 items-center justify-start gap-2 p-2",
									params.goal === goal.value
										? "bg-orange-500 text-white"
										: "border-orange-300 text-orange-700",
								)}
							>
								<Icon className="size-3" />
								<span className="text-xs">{goal.label}</span>
							</Button>
						);
					})}
				</div>
			</div>
		</div>
	);

	return (
		<TooltipProvider>
			<div className="mx-auto w-full max-w-2xl rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50/95 to-orange-100/95 shadow-lg backdrop-blur-md">
				{/* Header */}
				<div className="flex items-center justify-between border-orange-200 border-b p-3 text-center bg-gradient-to-br from-orange-50/95 to-orange-100/95">
					<div className="w-8" />
					<h2 className="flex items-center justify-center gap-2 font-bold text-base text-orange-800">
						<Target className="size-4" />
						Meditation Mode
					</h2>
					<Button
						size="icon"
						variant="ghost"
						onClick={toggleExpand}
						className="text-orange-600 hover:bg-orange-200 w-8 h-8"
					>
						{isExpanded ? (
							<ChevronsDown className="size-4" />
						) : (
							<ChevronsUp className="size-4" />
						)}
					</Button>
				</div>

				{isExpanded ? <ExpandedView /> : <CompactView />}

				{/* Generate Buttons */}
				<div className="space-y-2 border-orange-200 border-t p-3 mt-2 bg-gradient-to-br from-orange-50/95 to-orange-100/95">
					<Button
						onClick={handleGenerate}
						disabled={isGenerating || isTestGenerating}
						className="w-full bg-orange-500 py-2.5 font-medium text-sm text-white hover:bg-orange-600"
						size="default"
					>
						{isGenerating ? (
							<>
								<div className="mr-2 h-3 w-3 animate-spin rounded-full border-white border-b-2" />
								Generating...
							</>
						) : (
							<>
								<Play className="mr-2 size-4" />
								Generate Meditation
							</>
						)}
					</Button>

					<Button
						onClick={handleTestGenerate}
						disabled={isGenerating || isTestGenerating}
						className="w-full bg-blue-500 py-2 font-medium text-xs text-white hover:bg-blue-600"
						size="sm"
						variant="outline"
					>
						{isTestGenerating ? (
							<>
								<div className="mr-2 h-3 w-3 animate-spin rounded-full border-blue-500 border-b-2" />
								Testing...
							</>
						) : (
							<>
								<Zap className="mr-2 size-3" />
								Quick Test (1 sentence)
							</>
						)}
					</Button>

					<Button
						onClick={handleSwitchTTS}
						disabled={isSwitchingTTS}
						className={cn(
							"w-full py-1.5 font-medium text-white text-xs",
							currentTTSProvider === "openai"
								? "bg-green-600 hover:bg-green-700"
								: "bg-purple-600 hover:bg-purple-700",
						)}
						size="sm"
						variant="outline"
					>
						{isSwitchingTTS ? (
							<>
								<div className="mr-1 h-2 w-2 animate-spin rounded-full border-white border-b-2" />
								Switching...
							</>
						) : (
							<>
								<RefreshCw className="mr-1 size-3" />
								TTS: {currentTTSProvider.toUpperCase()}
							</>
						)}
					</Button>
				</div>
			</div>
		</TooltipProvider>
	);
}
