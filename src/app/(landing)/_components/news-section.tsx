import { Bell } from "lucide-react";
import { newsItems } from "../_data/news";
import type { NewsItem } from "../_types/news";

export function NewsSection() {
	return (
		<section id="news" className="py-20 bg-white">
			<div className="container mx-auto px-6">
				<NewsHeader />
				<div className="grid md:grid-cols-2 gap-8">
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
		<div className="bg-orange-50 rounded-lg p-6 hover:shadow-lg transition">
			<time className="text-sm text-orange-500">{item.date}</time>
			<h3 className="text-xl font-semibold mt-2 mb-3">{item.title}</h3>
			<p className="text-gray-600">{item.content}</p>
		</div>
	);
}

export function NewsHeader() {
	return (
		<div className="flex items-center justify-center gap-2 mb-12">
			<Bell className="h-6 w-6 text-orange-500" />
			<h2 className="text-3xl font-bold">Latest Updates</h2>
		</div>
	);
}
