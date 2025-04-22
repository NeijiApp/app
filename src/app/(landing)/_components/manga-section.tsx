"use client";

import { useInView } from "react-intersection-observer";

export function MangaReader() {
	return (
		<section id="manga-reader" className="bg-gray-50 py-20">
			<div className="container mx-auto px-6">
				<h2 className="mb-12 text-center font-bold text-3xl">Try Neiji</h2>
				<div className="relative mx-auto h-[600px] max-w-sm overflow-y-scroll rounded-lg border bg-white shadow-xl">
					<img
						src="/manga.png"
						width={914}
						height={14629}
						alt="Vertical Manga"
						className="w-full object-contain"
					/>
				</div>
				<p className="mt-4 text-center text-gray-600">
					Scroll to experience our story in a manga format!
				</p>
			</div>
		</section>
	);
}

export function MangaSection() {
	const { ref, inView } = useInView({
		triggerOnce: true,
		threshold: 0.1,
	});

	return (
		<section id="manga" className="bg-orange-0 py-0">
			<div className="container mx-auto px-6">
				<h2 className="mb-12 text-center font-bold text-3xl">Our Story</h2>
				<div
					ref={ref}
					className={`mx-auto max-w-sm transition-all duration-1000 ${
						inView ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
					}`}
				>
					<div className="overflow-hidden rounded-lg bg-white shadow-xl">
						<img
							src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
							alt="Manga Panel 1"
							className="h-[600px] w-full object-cover"
						/>
						<div className="p-6">
							<p className="text-gray-600">
								Follow the journey of Maya, a stressed corporate worker who
								discovers the power of meditation through the Neiji app...
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
