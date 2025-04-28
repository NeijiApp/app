import type * as React from "react";
import { cn } from "~/lib/utils";

export function GradientBackground({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"min-h-[calc(100vh-var(--spacing)*30)] bg-gradient-to-br from-white via-orange-100 to-orange-200",
				className,
			)}
			{...props}
		/>
	);
}
