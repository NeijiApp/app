"use client";

import { useChat } from "@ai-sdk/react";

import { UserMessage } from "./_components/user-message";
import { BotMessage } from "./_components/bot-message";
import { Chat, ChatMessages } from "./_components/chat";
import { ChatInput } from "./_components/chat-input";
import { GradientBackground } from "./_components/gradient-background";

export default function ChatPage() {
	const { messages, input, setInput, handleSubmit } = useChat({
		streamProtocol: "text",
	});
	return (
		<GradientBackground>
			<Chat>
				<ChatMessages>
					{messages.map((message) => {
						if (message.role === "user") {
							return (
								<UserMessage key={message.id}>{message.content}</UserMessage>
							);
						}

						return <BotMessage key={message.id}>{message.content}</BotMessage>;
					})}
				</ChatMessages>
				<ChatInput
					message={input}
					setMessage={setInput}
					handleSubmit={handleSubmit}
				/>
			</Chat>
		</GradientBackground>
	);
}
