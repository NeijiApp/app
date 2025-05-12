"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { manifestoItems } from "../_data/manifestoItems";

export function HomeManifesto() {
	const [activeIndex, setActiveIndex] = useState(0); // Start with 01 selected

	const handleItemClick = (index: number) => {
		setActiveIndex(index);
	};

	// Auto-rotate through manifesto items every 3 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			setActiveIndex((prev) => (prev + 1) % manifestoItems.length);
		}, 5000);
		return () => clearInterval(interval);
	}, []);

	const renderNumberNavigation = () => {
		return (
			<div className="mb-8 flex justify-center space-x-4 md:justify-start md:space-x-6">
				{manifestoItems.map((_, index) => {
					const number = (index + 1).toString().padStart(2, "0");
					const isActive = index === activeIndex;

					return (
						<button
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							key={index}
							type="button"
							onClick={() => handleItemClick(index)}
							className={`text-lg transition-all duration-300 md:text-xl ${
								isActive
									? "font-bold text-[#FF7043]"
									: "text-gray-500 hover:text-gray-300"
							}`}
							aria-label={`View manifesto point ${index + 1}`}
						>
							{number}
						</button>
					);
				})}
			</div>
		);
	};

	return (
		<div className="w-full bg-white py-16 md:py-24">
			<div className="container relative mx-auto flex h-[500px] max-w-5xl flex-col px-4 md:h-[600px] md:px-8">
				<h2 className="mb-8 text-center font-bold text-4xl text-[#6B4F2B] md:text-5xl">
					Our Manifesto
				</h2>
				<div className="flex h-full flex-col justify-between">
					{renderNumberNavigation()}

					<AnimatePresence mode="wait">
						<motion.div
							key={activeIndex}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.4 }}
							className="mt-6"
						>
							<div className="flex items-start gap-4">
								{manifestoItems[activeIndex]?.icon &&
									(() => {
										const Icon = manifestoItems[activeIndex].icon;
										return (
											<div className="flex-shrink-0 rounded-full bg-[#FF7043]/10 p-3">
												<Icon className="h-8 w-8 text-[#FF7043]" />
											</div>
										);
									})()}
								<div>
									<div className="font-medium text-[#FF7043] text-sm" />
									<h3 className="mb-4 font-bold text-3xl text-[#6B4F2B] md:text-4xl lg:text-5xl">
										{manifestoItems[activeIndex]?.title || ""}
									</h3>
									<p className="max-w-3xl whitespace-pre-line text-[#6B4F2B]/80 text-lg md:text-xl">
										{manifestoItems[activeIndex]?.description || ""}
									</p>
								</div>
							</div>
						</motion.div>
					</AnimatePresence>

					{/* Progress indicator - only visible on desktop */}
					<div className="mt-auto hidden pb-6 md:block">
						<div className="h-1 w-32 rounded-full bg-[#FF7043]" />
					</div>
				</div>
			</div>
		</div>
	);
}
