import type * as React from "react";
import { cn } from "~/lib/utils";

import { ScrollArea } from "~/components/ui/scroll-area";

export function Chat({ className, ...props }: React.ComponentProps<"div">) {
	return (
                <div
                        className={cn(
                                "relative mx-auto min-h-[calc(100vh-var(--spacing)*30)] max-w-2xl overflow-y-auto scroll-smooth",
                                className,
                        )}
                        {...props}
                />
	);
}
