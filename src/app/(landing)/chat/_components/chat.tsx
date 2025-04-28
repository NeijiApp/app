import type * as React from "react";
import { cn } from "~/lib/utils";

import { ScrollArea } from "~/components/ui/scroll-area";

export function Chat({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"relative mx-auto h-[calc(100vh-var(--spacing)*30)] max-w-2xl",
				className,
			)}
			{...props}
		/>
	);
}

export function ChatMessages({
	className,
	children,
	...props
}: React.ComponentProps<typeof ScrollArea>) {
	return (
		<ScrollArea
			className={cn("h-[calc(100vh-var(--spacing)*30)]", className)}
			{...props}
		>
			<div className="space-y-2 px-4">
				<div className="h-10 w-full" />
				{children}
				<div className="h-30 w-full" />
			</div>
		</ScrollArea>
	);
}
