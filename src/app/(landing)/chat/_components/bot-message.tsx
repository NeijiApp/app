import type * as React from "react";

import type { JSONValue, UIMessage } from "ai";
import Image from "next/image";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { z } from "zod";
import { Input } from "~/components/ui/input";
import { useDrawer } from "./drawer-context";

import type { ComponentProps, ElementType } from "react";
import type { ExtraProps } from "react-markdown";
import type {
	EmailInputAnnotation,
	PossibleAnnotation,
} from "~/app/api/chat/route";
import { cn } from "~/lib/utils";

function AnnotationInput({ annotation }: { annotation: EmailInputAnnotation }) {
	// Get drawer context to open the drawer when email annotation is detected
	const { openDrawer } = useDrawer();

	// Open drawer when this component mounts (when email annotation is detected)
	useEffect(() => {
		openDrawer();
	}, [openDrawer]);

	return null;
}

function Annotation({ annotation }: { annotation: PossibleAnnotation }) {
	if (annotation.type === "email")
		return <AnnotationInput annotation={annotation} />;

	return null;
}

function Annotations({
	annotations,
}: { annotations: UIMessage["annotations"] }) {
	if (!annotations) return null;

	if (annotations.length === 0) return null;

	return (
		<div className="flex flex-col gap-1">
			{(annotations as PossibleAnnotation[]).map((annotation, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				<Annotation key={i} annotation={annotation} />
			))}
		</div>
	);
}

export function BotMessage({ message }: { message: UIMessage }) {
	if (message.content.trim().length === 0) return null;

	return (
		<div className="relative pt-10">
			<div className="absolute top-1 flex items-center gap-1">
				<Image
					src="/NeijiHeadLogo1.4.png"
					alt="Neiji Logo Head"
					height={50}
					width={50}
				/>
				<span className="text-sm">Neiji</span>
			</div>
			<div className="prose prose-invert w-fit max-w-xs break-all rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none bg-orange-500 px-4 py-2 text-white shadow lg:max-w-md">
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
					{message.content}
				</ReactMarkdown>
			</div>
			<div className="max-w-xs pt-4 lg:max-w-md">
				<Annotations annotations={message.annotations} />
			</div>
		</div>
	);
}
