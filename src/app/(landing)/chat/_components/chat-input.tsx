"use client";

import { ArrowRight, Ban, SendHorizonal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useChatState } from "./provider";

interface ChatInputProps {
	onChatFocus?: (() => void) | undefined;
}

export function ChatInput({ onChatFocus }: ChatInputProps) {
	const {
		chat: { messages, input, handleInputChange, handleSubmit, status, stop },
	} = useChatState();

	const isLoading = useMemo(
		() => status === "streaming" || status === "submitted",
		[status],
	);

	return (
		<div className="fixed right-1/2 bottom-0 w-full max-w-xl translate-x-1/2 self-center rounded-t-2xl bg-gradient-to-r from-white/90 to-orange-100/90 p-4 shadow-[0_-5px_20px_rgba(251,146,60,0.1)] backdrop-blur-md transition-all duration-500 ease-in-out">
			<div className="relative flex items-center gap-2">
				<Input
					disabled={isLoading}
					type="text"
					value={input}
					onChange={handleInputChange}
					onKeyDown={(e) => {
						if (e.key === "Enter" && handleSubmit && !e.shiftKey) {
							e.preventDefault();
							handleSubmit(e as unknown as React.MouseEvent<HTMLButtonElement>);
						}
					}}
					onFocus={onChatFocus}
					placeholder={messages.length === 0 ? "Ask Neiji" : "Message"}
					className="h-14 flex-1 rounded-full bg-white pr-14 pl-5 text-base shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 border-none md:text-md"
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
					className="-translate-y-1/2 absolute top-1/2 right-2 size-11 rounded-full p-2 text-white z-50"
				>
					{isLoading ? (
						<Ban className="size-6" />
					) : (
						<SendHorizonal className="size-6" />
					)}
				</Button>
			</div>
		</div>
	);
}
