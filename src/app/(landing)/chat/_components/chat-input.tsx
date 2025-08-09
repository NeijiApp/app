"use client";

import { Ban, Brain, SendHorizonal, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { AskRegistrationDrawerContent, CustomDrawer } from "./custom-drawer";
import { MeditationPanel, type MeditationParams } from "./meditation-panel";
import { useChatState, useDrawer } from "./provider";

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

  const { isOpen } = useDrawer();

  const getVoiceId = (gender: "male" | "female"): string => {
    return gender === "female" ? "g6xIsTj2HwM6VR4iXFCw" : "GUDYcgRAONiI1nXDcNQQ";
  };

  const generatePrompt = (params: MeditationParams): string => {
    const guidanceInstructions = {
      beginner: "Provide detailed, step-by-step guidance.",
      confirmed: "Provide balanced guidance.",
      expert: "Provide minimal guidance, with long pauses.",
    } as const;
    const goalInstructions = {
      morning: "Create an energizing morning meditation.",
      focus: "Create a concentration meditation.",
      calm: "Create a calming meditation.",
      sleep: "Create a sleep meditation.",
    } as const;
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
    addCustomMessage({ id: loadingId, content: "🧘‍♀️ Generating your personalized meditation...", role: "assistant" });

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

      addCustomMessage({ id: `meditation-${Date.now()}`, content: `Here is your personalized meditation.`, role: "assistant", audioUrl });
    } catch (error) {
      console.error("Error generating meditation:", error);
      addCustomMessage({ id: `error-${Date.now()}`, content: "Sorry, I couldn't generate your meditation. Please try again.", role: "assistant" });
    } finally {
      setIsGeneratingMeditation(false);
    }
  };

  const handleMeditationSubmitFromInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!((input ?? "").trim())) return;

    const currentInput = (input ?? "");
    setInput("");

    setIsGeneratingMeditation(true);

    addCustomMessage({ id: `user-${Date.now()}`, content: currentInput, role: "user" });
    const loadingId = `loading-${Date.now()}`;
    addCustomMessage({ id: loadingId, content: "🧘‍♀️ Generating your personalized meditation from prompt...", role: "assistant" });

    try {
      const defaultVoiceId = getVoiceId("female");
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

      addCustomMessage({ id: `meditation-${Date.now()}`, content: `Here's your meditation based on your prompt.`, role: "assistant", audioUrl });
    } catch (error) {
      console.error("Error generating meditation from prompt:", error);
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

      {/* Meditation drawer overlay */}
      <div
        className={cn(
          "fixed right-1/2 bottom-[92px] z-5 w-full max-w-xl translate-x-1/2 transition-all duration-300 ease-in-out",
          meditationMode ? (isExpanded ? "h-[min(70dvh,calc(100dvh-140px))]" : "h-[min(45dvh,calc(100dvh-140px))]") : "h-0",
        )}
      >
        <div className="h-full overflow-hidden">
          <div className="h-full overflow-y-auto px-4 py-4">
            <MeditationPanel
              onGenerate={handleMeditationGenerate}
              isGenerating={isGeneratingMeditation}
              isExpanded={isExpanded}
              toggleExpand={() => setIsExpanded(!isExpanded)}
            />
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="fixed right-1/2 bottom-0 z-10 w-full max-w-xl translate-x-1/2 self-center">
        <div className="rounded-t-2xl bg-white/85 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md md:p-4">
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button type="button" size="icon" variant="orange" className="size-11 rounded-full">
                <User className="size-6" />
              </Button>
            </Link>

            <div className="group relative">
              <Button
                onClick={() => {
                  setMeditationMode(meditationMode === "meditation" ? "chat" : "meditation");
                  if (meditationMode === "meditation") setIsExpanded(false);
                }}
                size="icon"
                variant={meditationMode ? "orange" : "orangeOutline"}
                className="size-12 rounded-full"
              >
                <Brain className={cn("transition-all duration-300", meditationMode ? "size-7" : "size-6")} />
              </Button>

              {meditationMode && (
                <div className="absolute -right-1 -top-1 size-4 rounded-full border-2 border-white bg-orange-400">
                  <div className="size-full animate-pulse rounded-full bg-orange-300/70" />
                </div>
              )}
            </div>

            <form onSubmit={finalHandleSubmit} className="relative flex-1">
              <Input
                disabled={isLoading}
                type="text"
                value={input ?? ""}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    finalHandleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                  }
                }}
                onFocus={onChatFocus}
                placeholder={meditationMode ? "Describe your ideal meditation..." : "Ask me anything..."}
                className="h-12 w-full rounded-full border-orange-200 bg-white/80 pr-14 pl-6 text-base transition-all focus:bg-white focus:ring-2 focus:ring-orange-300"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isLoading ? (
                  <Button type="button" size="icon" variant="orangeOutline" onClick={stop} className="size-9 rounded-full">
                    <Ban className="size-5 animate-spin" />
                  </Button>
                ) : (
                  <Button type="submit" size="icon" variant="orange" className="size-9 rounded-full" disabled={!((input ?? "").trim())}>
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
