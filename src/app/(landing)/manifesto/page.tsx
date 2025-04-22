"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { manifestoItems } from "../_data/manifestoItems";
import { Item } from "./_components/item";

export default function Manifesto() {
	const { scrollYProgress } = useScroll();
	const isMobile = useMediaQuery({ maxWidth: 768 });

	// Configuration du parallaxe adaptatif
	const parallaxY = useTransform(
		scrollYProgress,
		[0, 1],
		[0, isMobile ? -40 : -80],
	);

	const rotate = useTransform(scrollYProgress, [0, 1], [-15, 15]);

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	return (
		<div className="relative min-h-screen overflow-hidden bg-white">
			{/* Texture animée (desktop only) */}
			{!isMobile && (
				<motion.div
					style={{ rotate }}
					className="pointer-events-none absolute inset-0 opacity-15 mix-blend-overlay"
				/>
			)}

			{/* Section Titre + Sous-titre */}
			<motion.div
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1, y: isMobile ? 60 : 20 }}
				transition={{ duration: 0.8, type: "spring" }}
				className={`${isMobile ? "px-4 pt-16" : "px-6 pt-32"} mx-auto max-w-5xl text-center`}
			>
				<h1
					className={`${isMobile ? "text-4xl" : "text-6xl"} mb-4 bg-clip-text font-bold text-[#FF7043]/90 text-transparent`}
				>
					Neiji's Manifesto
				</h1>
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
					className={`${isMobile ? "text-xl" : "text-2xl"} mb-12 font-medium text-[#FF7043]`}
				>
					7 Key Ideas to empower Gen-Z
				</motion.p>
			</motion.div>

			<div
				className={`mx-auto ${isMobile ? "max-w-md px-4" : "max-w-5xl px-6"} py-10`}
			>
				<motion.div
					className={isMobile ? "space-y-4" : "space-y-12"}
					style={!isMobile ? { y: parallaxY } : {}}
				>
					{manifestoItems.map((item, index) => (
						<Item
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							key={index}
							icon={item.icon}
							title={item.title}
							description={item.description}
							isMobile={isMobile}
							index={index}
						/>
					))}
				</motion.div>
			</div>
		</div>
	);
}
