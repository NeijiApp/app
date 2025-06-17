import Image from "next/image";
import { useEffect, useState, type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { cn } from "~/lib/utils";
import { EnhancedAudioPlayer } from "./enhanced-audio-player";
import type { ExtendedMessage } from "./provider";
import type { ExtraProps } from "react-markdown";

interface BotMessageProps {
	message: ExtendedMessage;
}

export function BotMessage({ message }: BotMessageProps) {
        const [displayedText, setDisplayedText] = useState("");
        const [visible, setVisible] = useState(false);

    	useEffect(() => {
                setVisible(true);
                if (message.content.trim().length === 0) return;

		let currentIndex = 0;
		const text = message.content;
		let cancelled = false;
		
		// Réinitialiser le texte affiché
		setDisplayedText("");

		function showNextChar() {
			if (cancelled) return;
			if (currentIndex < text.length) {
				setDisplayedText(text.substring(0, currentIndex + 1));
				currentIndex++;
				setTimeout(showNextChar, 15); // Adjust speed here (ms per letter)
			}
		}

		// Commencer immédiatement
		showNextChar();

		return () => {
			cancelled = true;
		};
	}, [message.content]);

	if (message.content.trim().length === 0) return null;

	return (
                <div className={cn("relative pt-10 transition-opacity duration-500", visible ? "opacity-100" : "opacity-0")}>
			<div className="absolute top-1 flex items-center gap-1">
				<Image
					src="/NeijiHeadLogo1.4.png"
					alt="Neiji Logo Head"
					height={50}
					width={50}
				/>
				<span className="text-sm">Neiji</span>
			</div>
			<div className="w-fit max-w-xs whitespace-pre-line break-normal rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none bg-orange-500 px-4 py-2 text-white shadow lg:max-w-md">
				<ReactMarkdown
					remarkPlugins={[remarkGfm]}
					rehypePlugins={[rehypeHighlight]}
					components={{
						// Override default element styling
						p: ({ children }) => <p className="my-1">{children}</p>,
						a: ({ href, children }) => (
							<a
								href={href}
								className="text-blue-200 underline hover:text-blue-300"
								target="_blank"
								rel="noopener noreferrer"
							>
								{children}
							</a>
						),
						code: ({
							className,
							children,
							...props
						}: ComponentProps<"code"> & ExtraProps) => (
							<code
								className={cn(
									"block overflow-x-auto rounded-md bg-gray-800 p-2",
									className,
								)}
								{...props}
							>
								{children}
							</code>
						),
					}}
				>
					{displayedText}
				</ReactMarkdown>
			</div>
			
			{/* Enhanced Audio Player for meditation messages */}
			{message.audioUrl && (
				<div className="mt-4 max-w-xs lg:max-w-md">
					<EnhancedAudioPlayer 
						audioUrl={message.audioUrl} 
						title="Your Meditation"
					/>
				</div>
			)}
		</div>
	);
}
