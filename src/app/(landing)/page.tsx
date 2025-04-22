import { ContactSection } from "./_components/contact-section";
import { Hero } from "./_components/hero";
import { MangaReader } from "./_components/manga-section";
import { NewsSection } from "./_components/news-section";
import { NewsletterSection } from "./_components/newsletter-section";

export default function Homepage() {
	return (
		<div className="min-h-screen">
			<main>
				<section id="manga">
					<Hero />
				</section>
				<section id="manganeiji">
					<MangaReader />
				</section>
				<section id="news">
					<NewsSection />
				</section>
				<section id="newsletter">
					<NewsletterSection />
				</section>
			</main>
		</div>
	);
}
