import type * as React from "react";
import { cn } from "~/lib/utils";

export function GradientBackground({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<>
			{/* Fixed background that covers the entire page */}
			<div className="-z-10 fixed inset-0 h-full w-full bg-gradient-to-br from-white via-orange-100 to-orange-200" />

			{/* Content container */}
			<div className={cn("relative z-0 min-h-screen", className)} {...props} />
		</>
	);
}
