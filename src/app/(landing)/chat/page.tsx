"use client";

import Image from "next/image";
import { useEffect } from "react";

import { BotMessage } from "./_components/bot-message";
import { Chat } from "./_components/chat";
import { ChatInput } from "./_components/chat-input";
import { GradientBackground } from "./_components/gradient-background";
import { UserMessage } from "./_components/user-message";

import { DrawerProvider } from "./_components/drawer-context";
import { ChatStateProvider, useChatState } from "./_components/provider";

function ChatLogic() {
  const {
    chat: { messages, input, setInput, handleSubmit, status, setMessages },
  } = useChatState();

  // Auto-scroll interval effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const scrollToBottom = () => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    };

    // Start auto-scrolling when status is "submitted" or "streaming"
    if (status === "submitted" || status === "streaming") {
      // Initial scroll
      scrollToBottom();
      // Set up interval for continuous scrolling
      intervalId = setInterval(scrollToBottom, 100);
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status]);

  return (
    <DrawerProvider chatStatus={status}>
      <Chat>
        <div className="container relative z-0 mx-auto space-y-4 px-4 pt-8 pb-30 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 pt-40 text-center">
              <Image
                src="/logo-neiji-full.png"
                alt="Neiji Logo"
                width={120}
                height={120}
              />
              <p className="mx-auto max-w-md px-4 text-lg text-muted-foreground">
                I'm your coach for self development, Soonly sharing tailored
                mindfulness.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              if (message.role === "user") {
                return (
                  <UserMessage key={message.id}>{message.content}</UserMessage>
                );
              }

              return <BotMessage key={message.id} message={message} />;
            })
          )}
        </div>
        <ChatInput
          onChatFocus={() => {
            if (messages.length === 0) {
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
    </DrawerProvider>
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
}
