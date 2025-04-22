"use client";

import { useInView } from "react-intersection-observer";

export function MangaReader() {
	return (
		<section id="manga-reader" className="py-20 bg-gray-50">
			<div className="container mx-auto px-6">
				<h2 className="text-3xl font-bold text-center mb-12">Try Neiji</h2>
				<div className="relative max-w-sm mx-auto h-[600px] overflow-y-scroll bg-white rounded-lg shadow-xl border">
					<img
						src="/manga.png"
						width={914}
						height={14629}
						alt="Vertical Manga"
						className="w-full object-contain"
					/>
				</div>
				<p className="text-center text-gray-600 mt-4">
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
		<section id="manga" className="py-0 bg-orange-0">
			<div className="container mx-auto px-6">
				<h2 className="text-3xl font-bold text-center mb-12">Our Story</h2>
				<div
					ref={ref}
					className={`max-w-sm mx-auto transition-all duration-1000 ${
						inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
					}`}
				>
					<div className="bg-white rounded-lg shadow-xl overflow-hidden">
						<img
							src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
							alt="Manga Panel 1"
							className="w-full h-[600px] object-cover"
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
