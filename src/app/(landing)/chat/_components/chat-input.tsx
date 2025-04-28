"use client";

import { ArrowRight, SendHorizonal } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
	message?: string | undefined;
	setMessage?: ((message: string) => void) | undefined;
	handleSubmit?: React.HTMLProps<HTMLButtonElement>["onClick"] | undefined;
	onChatFocus?: (() => void) | undefined;
	placeholder?: string | undefined;
}

export function ChatInput({
	message,
	setMessage,
	handleSubmit,
	onChatFocus,
	placeholder,
}: ChatInputProps) {
	return (
		<div className="absolute right-1/2 bottom-0 w-full max-w-xl translate-x-1/2 self-center rounded-t-2xl bg-gradient-to-r from-white/90 to-orange-100/90 p-4 shadow-[0_-5px_20px_rgba(251,146,60,0.1)] backdrop-blur-md transition-all duration-500 ease-in-out">
			<div className="relative flex items-center gap-2">
				<input
					type="text"
					value={message}
					onChange={(e) => {
						if (setMessage) setMessage(e.target.value);
					}}
					onFocus={onChatFocus}
					placeholder={placeholder}
					className="flex-1 animate-[fadeIn_0.4s_ease-out] cursor-pointer rounded-full bg-white px-6 py-3 text-lg shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
				/>
				<button
					type="submit"
					onClick={handleSubmit}
					className="-translate-y-1/2 absolute top-1/2 right-2 transform animate-[popIn_0.4s_ease-out_0.1s_both] rounded-full bg-orange-500 p-2 text-white shadow-[0_2px_8px_rgba(251,146,60,0.3)] transition-all hover:bg-orange-600 hover:shadow-lg"
				>
					<SendHorizonal />
				</button>
			</div>
		</div>
	);
}
