import type * as React from "react";
import { cn } from "~/lib/utils";

import { ScrollArea } from "~/components/ui/scroll-area";

export function Chat({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"relative mx-auto min-h-[100dvh] max-w-2xl pb-[calc(104px+env(safe-area-inset-bottom))] scroll-smooth",
				className,
			)}
			{...props}
		/>
	);
}
