"use client";

import { OctagonX, type LucideIcon, Plus, SendHorizonal } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AskRegistrationDrawerContent, CustomDrawer } from "./custom-drawer";
import { useDrawer } from "./drawer-context";
import { useChatState } from "./provider";
import { api } from "~/trpc/react";

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

  // API mutation for saving email to newsletter
  const { mutateAsync: saveEmail } = api.newsletter.create.useMutation();

  // Cooldown ref to prevent reopening right after closing
  const cooldownRef = useRef(false);
  const lastOpenTimeRef = useRef(0);

  const isLoading = useMemo(
    () => status === "streaming" || status === "submitted",
    [status]
  );

  // Use the shared drawer context
  const {
    isOpen,
    toggleDrawer,
    openDrawer,
    closeDrawer,
    isWaitingForEmail,
    setIsWaitingForEmail,
    isAIWriting,
    setRegistrationSuccess,
  } = useDrawer();

  // Safe toggle drawer function that checks if AI is still writing
  const safeToggleDrawer = () => {
    if (!isAIWriting) {
      toggleDrawer(); // This is a manual toggle, not automatic
      // Set cooldown when manually opening to prevent auto-detection from reopening
      if (!isOpen) {
        cooldownRef.current = true;
        lastOpenTimeRef.current = Date.now();
        setTimeout(() => {
          cooldownRef.current = false;
        }, 10000); // 10 second cooldown
      }
    }
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isWaitingForEmail) {
      // Validate the email (simple validation)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(input)) {
        try {
          // Save the email to the database via the newsletter API
          await saveEmail({ email: input });

          // Set success state
          setRegistrationSuccess(true);

          // Close the drawer and reset state
          closeDrawer();
          setIsWaitingForEmail(false);

          // Clear the input
          handleInputChange({
            target: { value: "" },
          } as React.ChangeEvent<HTMLInputElement>);

          // Set cooldown after submitting email
          cooldownRef.current = true;
          lastOpenTimeRef.current = Date.now();
          setTimeout(() => {
            cooldownRef.current = false;
          }, 10000); // 10 second cooldown
          return;
        } catch (error) {
          console.error("Failed to save email:", error);
          // Continue with submit anyway even if save failed
        }
      }
    }

    // If not handling email or email is invalid, use the normal submit
    handleSubmit(e);
  };

  const handleRegistrationConfirm = () => {
    setIsWaitingForEmail(true);
  };

  // When drawer is closed, set a cooldown period to prevent reopening
  useEffect(() => {
    if (!isOpen) {
      cooldownRef.current = true;
      lastOpenTimeRef.current = Date.now();
      setTimeout(() => {
        cooldownRef.current = false;
      }, 10000); // 10 second cooldown
    }
  }, [isOpen]);

  // Function to detect registration intent in user input
  useEffect(() => {
    // This effect will run when the input changes or when a message is submitted
    // Here you would implement the detection logic to see if user wants to register
    // For example, checking if user's message contains "register", "sign up", etc.

    const checkForRegistrationIntent = () => {
      // Skip if in cooldown period or drawer is already open
      if (cooldownRef.current || isOpen) {
        return;
      }

      // Only check the last user message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "user") {
        const content = lastMessage.content.toLowerCase();

        const registrationKeywords = [
          "register",
          "signup",
          "sign up",
          "subscribe",
          "account",
          "create account",
          "inscrire",
          "m'inscrire",
          "inscription",
        ];

        const hasIntent = registrationKeywords.some((keyword) =>
          content.includes(keyword)
        );

        if (hasIntent && !isAIWriting && !isOpen) {
          // Open drawer automatically with auto-close flag
          openDrawer(true); // Mark this as an automatic open
        }
      }
    };

    // Run the check when a message is complete (not while streaming)
    if (status === "ready" || status === "error") {
      checkForRegistrationIntent();
    }
  }, [messages, status, isAIWriting, isOpen, openDrawer, lastOpenTimeRef]);

  // Add a key listener for debugging - press Escape to force close the drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDrawer]);

  // Ensure drawer is in the right state
  const drawerIsVisible = isOpen && !isAIWriting;

  return (
    <div className="relative">
      {/* Custom drawer that appears behind the input */}
      <div className="mb-16">
        <CustomDrawer isOpen={drawerIsVisible}>
          <AskRegistrationDrawerContent
            onConfirmRegistration={handleRegistrationConfirm}
          />
        </CustomDrawer>
      </div>
      {/* Input container */}
      <div className="fixed right-1/2 bottom-0 z-10 w-full max-w-xl translate-x-1/2 self-center rounded-t-2xl bg-gradient-to-r from-white/90 to-orange-100/90 p-4 backdrop-blur-md transition-all duration-500 ease-in-out">
        <div className="flex items-center gap-3">
          {/* Drawer toggle button */}
          <Button
            type="button"
            size="icon"
            className="size-11 flex-shrink-0 rounded-full p-2 text-white"
            onClick={safeToggleDrawer}
          >
            <Plus className="size-6" />
          </Button>

          {/* Input and send button container */}
          <div className="relative flex-1">
            <Input
              disabled={isLoading}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (isWaitingForEmail) {
                    handleEmailSubmit(
                      e as unknown as React.MouseEvent<HTMLButtonElement>
                    );
                  } else {
                    handleSubmit(
                      e as unknown as React.MouseEvent<HTMLButtonElement>
                    );
                  }
                }
              }}
              onFocus={onChatFocus}
              placeholder={
                isWaitingForEmail
                  ? "Entre ton email ici"
                  : messages.length === 0
                  ? "Ask Neiji"
                  : "Message"
              }
              className="h-14 w-full rounded-full border-none bg-white pr-14 pl-5 text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 md:text-md"
            />

            {/* Send button */}
            <Button
              disabled={!isLoading && input.length === 0}
              type="submit"
              onClick={
                isLoading
                  ? () => stop()
                  : isWaitingForEmail
                  ? handleEmailSubmit
                  : handleSubmit
              }
              size="icon"
              className="-translate-y-1/2 absolute top-1/2 right-1.5 z-10 size-11 rounded-full p-2 text-white"
            >
              {isLoading ? (
                <OctagonX className="size-6" />
              ) : (
                <SendHorizonal className="size-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
