import type * as React from "react";

import Image from "next/image";

export function BotMessage({ children }: { children?: React.ReactNode }) {
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
				{children}
			</div>
		</div>
	);
}
