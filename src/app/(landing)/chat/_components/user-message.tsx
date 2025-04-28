import type * as React from "react";

export function UserMessage({ children }: { children?: React.ReactNode }) {
	return (
		<div className="flex justify-end">
			<div className="max-w-xs rounded-tl-xl rounded-tr-xl rounded-br-none rounded-bl-xl bg-white px-4 py-2 text-gray-800 shadow lg:max-w-md">
				{children}
			</div>
		</div>
	);
}
