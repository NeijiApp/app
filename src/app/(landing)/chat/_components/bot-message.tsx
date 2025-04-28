import type * as React from "react";

import Image from "next/image";
import type { JSONValue, UIMessage } from "ai";
import { z } from "zod";
import { Input } from "~/components/ui/input";

function AnnotationInput({ annotation }: { annotation: JSONValue }) {
	const data = z
		.object({ prompt: z.object({ type: z.string(), placeholder: z.string() }) })
		.safeParse(annotation);

	if (!data.success) return null;

	return (
		<Input
			className="bg-background"
			placeholder={data.data.prompt.placeholder}
		/>
	);
}

function Annotation({ annotation }: { annotation: JSONValue }) {
	const ui_annotation = z
		.object({ prompt: z.object({ type: z.string() }) })
		.safeParse(annotation);

	if (!ui_annotation.success) return null;

	if (ui_annotation.data.prompt.type === "input")
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
			{annotations.map((annotation, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				<Annotation key={i} annotation={annotation} />
			))}
		</div>
	);
}

export function BotMessage({ message }: { message: UIMessage }) {
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
			<div className="w-fit max-w-xs rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none bg-orange-500 px-4 py-2 text-white shadow lg:max-w-md">
				{message.content}
			</div>
			<div className="max-w-xs pt-4 lg:max-w-md">
				<Annotations annotations={message.annotations} />
			</div>
		</div>
	);
}
