import type * as React from "react";
import { cn } from "~/lib/utils";

export function GradientBackground({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<>
			{/* Fixed background that covers the entire page */}
			<div className="fixed inset-0 w-full h-full bg-gradient-to-br from-white via-orange-100 to-orange-200 -z-10" />
			
			{/* Content container */}
			<div
				className={cn(
					"min-h-screen relative z-0",
					className,
				)}
				{...props}
			/>
		</>
	);
}
