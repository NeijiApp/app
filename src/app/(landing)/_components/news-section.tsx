import { Bell } from "lucide-react";
import { newsItems } from "../_data/news";
import type { NewsItem } from "../_types/news";

export function NewsSection() {
	return (
		<section id="news" className="bg-white py-20">
			<div className="container mx-auto px-6">
				<NewsHeader />
				<div className="grid gap-8 md:grid-cols-2">
					{newsItems.map((item, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<NewsCard key={index} item={item} />
					))}
				</div>
			</div>
		</section>
	);
}

export function NewsCard({ item }: { item: NewsItem }) {
	return (
		<div className="rounded-lg bg-orange-50 p-6 transition hover:shadow-lg">
			<time className="text-orange-500 text-sm">{item.date}</time>
			<h3 className="mt-2 mb-3 font-semibold text-xl">{item.title}</h3>
			<p className="text-gray-600">{item.content}</p>
		</div>
	);
}

export function NewsHeader() {
	return (
		<div className="mb-12 flex items-center justify-center gap-2">
			<Bell className="h-6 w-6 text-orange-500" />
			<h2 className="font-bold text-3xl">Latest Updates</h2>
		</div>
	);
}
