"use client";

import {
	ArrowRight,
	Ban,
	FileText,
	type LucideIcon,
	Play,
	RotateCcw,
	SendHorizonal,
	Signpost,
	TextCursor,
	TextCursorInput,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useChatState } from "./provider";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

interface ChatInputProps {
	onChatFocus?: (() => void) | undefined;
}

function ChatModeButton({
	icon: Icon,
	tooltip,
	...props
}: { icon: LucideIcon; tooltip: string } & React.ComponentProps<
	typeof Button
>) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant="ghost" size="icon" {...props}>
						<Icon className="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{tooltip}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

function ChatCard({
	isOpen,
	setOpen,
	children,
}: {
	isOpen: boolean;
	setOpen: (value: boolean) => void;
	children?: React.ReactNode | undefined;
}) {
	return (
		<div
			className={cn("w-11/12 rounded-t-xl bg-background transition-all", {
				"p-3": isOpen,
			})}
		>
			{isOpen ? children : null}
		</div>
	);
}

export function ChatInput({ onChatFocus }: ChatInputProps) {
	const {
		chat: { messages, input, handleInputChange, handleSubmit, status, stop },
	} = useChatState();

	const [cardOpen, setCardOpen] = useState<
		null | "play" | "options" | "form"
	>();

	const isLoading = useMemo(
		() => status === "streaming" || status === "submitted",
		[status],
	);

	return (
		<div className="fixed bottom-0 w-full max-w-xl self-center">
			<div className="-translate-x-1/2 -translate-y-full absolute absolute top-0 left-1/2 w-full">
				<div className="relative flex flex-col items-center">
					<div className="flex gap-1 rounded-t-xl bg-background p-1">
						<ChatModeButton
							onClick={() => setCardOpen((v) => (v === "play" ? null : "play"))}
							variant={cardOpen === "play" ? "default" : "ghost"}
							icon={Play}
							tooltip="Audio Player"
						/>
						<ChatModeButton
							onClick={() =>
								setCardOpen((v) => (v === "options" ? null : "options"))
							}
							variant={cardOpen === "options" ? "default" : "ghost"}
							icon={Signpost}
							tooltip="Option Selection"
						/>
						<ChatModeButton
							onClick={() => setCardOpen((v) => (v === "form" ? null : "form"))}
							variant={cardOpen === "form" ? "default" : "ghost"}
							icon={TextCursorInput}
							tooltip="Form"
						/>
					</div>
					<ChatCard
						isOpen={cardOpen === "play"}
						setOpen={(v) => setCardOpen(v ? "play" : null)}
					>
						<div className="w-full space-y-3">
							{/* Controls */}
							<div className="flex items-end justify-between">
								<div className="flex items-center gap-2">
									<Button size="icon" variant="outline" aria-label="Play">
										<Play className="h-5 w-5" />
									</Button>
									<Button size="icon" variant="outline" aria-label="Reset">
										<RotateCcw className="h-5 w-5" />
									</Button>
								</div>

								<span className="w-12 text-right font-mono text-sm tabular-nums">
									01:23
								</span>
							</div>

							{/* Progress Bar */}
							<div className="flex items-center gap-3">
								<input
									type="range"
									min={0}
									max={100}
									className="h-2 w-full rounded-lg bg-primary/20 accent-primary"
								/>
							</div>
						</div>
					</ChatCard>
					<ChatCard
						isOpen={cardOpen === "options"}
						setOpen={(v) => setCardOpen(v ? "options" : null)}
					>
						<div className="grid grid-cols-2 gap-2">
							<Button className="h-18" variant="outline">
								Option 1
							</Button>
							<Button className="h-18" variant="outline">
								Option 2
							</Button>
							<Button className="h-18" variant="outline">
								Option 3
							</Button>
							<Button className="h-18" variant="outline">
								Option 4
							</Button>
						</div>
					</ChatCard>
					<ChatCard
						isOpen={cardOpen === "form"}
						setOpen={(v) => setCardOpen(v ? "form" : null)}
					>
						<div className="space-y-2">
							<Input type="email" placeholder="Enter your email to subscribe" />
							<Button type="submit" className="w-full">
								Submit
							</Button>
						</div>
					</ChatCard>
				</div>
			</div>
			<div className="relative rounded-t-2xl bg-background p-4">
				<div className="relative flex items-center gap-2">
					<Input
						disabled={isLoading}
						type="text"
						value={input}
						onChange={handleInputChange}
						onKeyDown={(e) => {
							if (e.key === "Enter" && handleSubmit && !e.shiftKey) {
								e.preventDefault();
								handleSubmit(
									e as unknown as React.MouseEvent<HTMLButtonElement>,
								);
							}
						}}
						onFocus={onChatFocus}
						placeholder={messages.length === 0 ? "Ask Neiji" : "Message"}
						className="h-14 flex-1 rounded-full border bg-white pr-14 pl-5 text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 md:text-md"
					/>
					<Button
						disabled={!isLoading && input.length === 0}
						type="submit"
						onClick={
							isLoading
								? () => {
										stop();
									}
								: handleSubmit
						}
						size="icon"
						className="-translate-y-1/2 absolute top-1/2 right-2 z-50 size-11 rounded-full p-2 text-white"
					>
						{isLoading ? (
							<Ban className="size-6" />
						) : (
							<SendHorizonal className="size-6" />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
