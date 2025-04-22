"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function Item({
	icon: Icon,
	title,
	description,
	isMobile,
	index,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	isMobile: boolean;
	index: number;
}) {
	const itemNumber = `${(index + 1).toString().padStart(2, "0")}.`;

	return (
		<motion.div
			initial={{ opacity: 0, y: isMobile ? 20 : 10 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: isMobile ? "0px" : "-25% 0px" }}
			transition={{ duration: 0.6, delay: index * 0.1 }}
			className="relative"
		>
			<div
				className={`flex ${isMobile ? "flex-col items-start" : "items-center"} gap-1`}
			>
				{/* Icon container with connection line */}
				<div className={`relative ${isMobile ? "mb-4" : ""}`}>
					{!isMobile ? (
						<div className="-top-2 absolute left-6 font-bold text-4xl text-[#6B4F2B]">
							{itemNumber}
						</div>
					) : null}
					<motion.div
						whileHover={{ scale: 1.1, rotate: 12 }}
						transition={{ type: "spring", stiffness: 300 }}
					>
						<Icon
							className={`${
								isMobile ? "ml-4 h-12 w-12" : "h-40 w-20"
							} text-[#FF7043] opacity-90 transition-all duration-300`}
							strokeWidth={1.5}
						/>
					</motion.div>

					{/* Animated connection line */}
					{
						<motion.div
							initial={{ scale: 0 }}
							whileInView={{ scale: 1 }}
							transition={{ delay: 0.3, duration: 0.4 }}
							className={`absolute ${
								isMobile
									? "-translate-y-1/2 top-14 left-4 h-0.5 w-14 bg-[#FF7043]/50"
									: "-right-5 -translate-x-full top-12 h-20 w-0.5 bg-[#FF7043]/60"
							}`}
						/>
					}
				</div>

				{/* Text content */}
				<div className={`${isMobile ? "pr-4 pl-4" : "pl-8"} flex-1`}>
					<motion.h2
						whileHover={{ x: isMobile ? 0 : -8 }}
						className={`${
							isMobile ? "text-3xl" : "text-4xl"
						} mb-4 font-bold text-[#6B4F2B]`}
					>
						{isMobile ? `${itemNumber} ${title}` : title}
					</motion.h2>

					<motion.p
						initial={{ opacity: isMobile ? 1 : 0.8 }}
						whileHover={isMobile ? {} : { opacity: 1 }}
						className={`text-[#6B4F2B] ${
							isMobile ? "text-base" : "text-lg"
						} leading-relaxed`}
					>
						{description}
					</motion.p>
				</div>
			</div>
		</motion.div>
	);
}
