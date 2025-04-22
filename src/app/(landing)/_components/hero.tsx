import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
	return (
		<section className="bg-gradient-to-b from-orange-50 to-white pt-24 pb-12">
			<div className="container mx-auto px-6">
				<div className="flex flex-col items-center gap-12 lg:flex-row">
					<div className="flex-1 text-center lg:text-left">
						<h1 className="mb-6 font-bold text-4xl text-gray-900 lg:text-6xl">
							Grow with <span className="text-orange-500">Neiji</span>,<br />
							Play with <span className="text-orange-500">Neiji</span>
						</h1>
						<p className="mb-8 text-gray-600 text-lg">
							Meet your mindfulness partner. Personalised guidance,
							science-backed practices, and a journey to transform stress into
							strength.
							<br /> Start your building your habit today.
						</p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
							<a
								href="#newsletter"
								className="flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-3 text-white transition hover:bg-orange-600"
							>
								<Sparkles className="h-5 w-5" />
								Download App
							</a>
							<Link
								href="/manifesto"
								className="rounded-full border-2 border-orange-500 px-8 py-3 text-center text-orange-500 transition hover:bg-orange-50"
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
