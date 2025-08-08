"use client";

<<<<<<< HEAD
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedChatRedirect() {
	const router = useRouter();
	useEffect(() => {
		router.replace("/chat");
	}, [router]);
	return null;
=======
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { BotMessage } from "./_components/bot-message";
import { Chat } from "./_components/chat";
import { ChatInput } from "./_components/chat-input";
import { GradientBackground } from "./_components/gradient-background";
import { UserMessage } from "./_components/user-message";

import { ChatStateProvider, useChatState } from "./_components/provider";

function ChatLogic() {
	const {
		chat: { messages, status, setMessages },
		customMessages,
	} = useChatState();

	// Combine regular chat messages and custom meditation messages
	const allMessages = [...messages, ...customMessages].sort((a, b) => {
		// Sort by timestamp if available, otherwise by creation order
		const aTime = parseInt(a.id.split('-')[1] || '0');
		const bTime = parseInt(b.id.split('-')[1] || '0');
		return aTime - bTime;
	});

	// Bottom sentinel for smooth auto-scroll
	const bottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [allMessages.length, status]);

	return (
		<Chat>
			<div className="container relative z-0 mx-auto space-y-4 px-4 pt-6 sm:px-6">
				{allMessages.length === 0 ? (
					<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
						<Image
							src="/logo-neiji-full.png"
							alt="Neiji Logo"
							width={96}
							height={96}
						/>
						<p className="mx-auto max-w-md px-4 text-base text-muted-foreground">
							I'm your coach for self development, Soonly sharing tailored
							mindfulness.
						</p>
					</div>
				) : (
					allMessages.map((message, index) => {
						if (message.role === "user") {
							return (
								<UserMessage key={message.id}>{message.content}</UserMessage>
							);
						}

						if (status === "streaming" && index === allMessages.length - 1 && !('audioUrl' in message)) {
							return null;
						}

						return <BotMessage key={message.id} message={message} />;
					})
				)}
				<div ref={bottomRef} />
			</div>
			<ChatInput
				onChatFocus={() => {
					if (allMessages.length === 0) {
						setMessages([
							{
								id: "msg-originalmessage",
								content:
									"Hey ! What is the one thing you want to improve in your life today ?",
								role: "assistant",
							},
						]);
					}
				}}
			/>
		</Chat>
	);
}

export default function ChatPage() {
	return (
		<GradientBackground>
			<ChatStateProvider>
				<ChatLogic />
			</ChatStateProvider>
		</GradientBackground>
	);
>>>>>>> origin/cursor/refactor-chat-ui-for-consistency-and-responsiveness-b6f1
}
