import { Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Hero() {
	return (
		<section className="pt-24 pb-12 bg-gradient-to-b from-orange-50 to-white">
			<div className="container mx-auto px-6">
				<div className="flex flex-col lg:flex-row items-center gap-12">
					<div className="flex-1 text-center lg:text-left">
						<h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
							Grow with <span className="text-orange-500">Neiji</span>,<br />
							Play with <span className="text-orange-500">Neiji</span>
						</h1>
						<p className="text-lg text-gray-600 mb-8">
							Meet your mindfulness partner. Personalised guidance,
							science-backed practices, and a journey to transform stress into
							strength.
							<br /> Start your building your habit today.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
							<a
								href="#newsletter"
								className="px-8 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition flex items-center justify-center gap-2"
							>
								<Sparkles className="h-5 w-5" />
								Download App
							</a>
							<Link
								href="/manifesto"
								className="px-8 py-3 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 transition text-center"
							>
								Neiji's Manifesto
							</Link>
						</div>
					</div>
					<div className="flex-1">
						<Image
							src="/demo.png"
							width={765}
							height={681}
							alt="Meditation App Preview"
							className="rounded-3xl shadow-2xl"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
