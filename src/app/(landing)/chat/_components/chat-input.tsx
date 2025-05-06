"use client";

import { Plus, Ban, SendHorizonal } from "lucide-react";
import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useChatState } from "./provider";
import { CustomDrawer, AskRegistrationDrawerContent } from "./custom-drawer";
import { useDrawer } from "./drawer-context";

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

	// Use the shared drawer context instead of local state
	const { isOpen, toggleDrawer } = useDrawer();

	return (
		<div className="relative">
			{/* Custom drawer that appears behind the input */}
			<div className="mb-16">
				<CustomDrawer isOpen={isOpen}>
					<AskRegistrationDrawerContent onClose={() => useDrawer().closeDrawer()} />
				</CustomDrawer>
			</div>
			{/* Input container */}
			<div className="fixed right-1/2 bottom-0 w-full max-w-xl translate-x-1/2 self-center rounded-t-2xl bg-gradient-to-r from-white/90 to-orange-100/90 p-4 backdrop-blur-md transition-all duration-500 ease-in-out z-10">
				<div className="flex items-center gap-3">
					{/* Drawer toggle button */}
					<Button
						type="button"
						size="icon"
						className="size-11 rounded-full p-2 text-white flex-shrink-0"
						onClick={toggleDrawer}
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
								if (e.key === "Enter" && handleSubmit && !e.shiftKey) {
									e.preventDefault();
									handleSubmit(e as unknown as React.MouseEvent<HTMLButtonElement>);
								}
							}}
							onFocus={onChatFocus}
							placeholder={messages.length === 0 ? "Ask Neiji" : "Message"}
							className="h-14 w-full rounded-full bg-white pr-14 pl-5 text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 border-none md:text-md"
						/>
						
						{/* Send button */}
						<Button
							disabled={!isLoading && input.length === 0}
							type="submit"
							onClick={isLoading ? () => stop() : handleSubmit}
							size="icon"
							className="-translate-y-1/2 absolute top-1/2 right-1.5 size-11 rounded-full p-2 text-white z-10"
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
		</div>
	);
}
