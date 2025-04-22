"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Menu, X } from "lucide-react";

export default function LandingLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen">
			<Header />
			<div className="pt-20">{children}</div>
		</div>
	);
}

function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
	const navigate = useRouter();

	const handleLogoClick = (e: React.MouseEvent) => {
		e.preventDefault();
		navigate.push("/");
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<header className="fixed z-50 w-full bg-white/90 backdrop-blur-sm">
			<nav className="container mx-auto px-2 py-2">
				<div className="flex items-center justify-between">
					{/* Desktop Version */}
					<div className="hidden items-center space-x-8 md:flex">
						<a
							href="/"
							onClick={handleLogoClick}
							className="flex items-center transition-opacity hover:opacity-80"
						>
							<Image
								src="/logo-neiji-full.png"
								alt="Neiji Logo"
								width={620}
								height={403}
								className="h-20 w-30"
							/>
							{/* Font display for desktop */}
							<span className="font-bold text-4xl text-orange-500">Neiji</span>
						</a>
					</div>

					{/* Mobile Version */}
					<div className="flex w-full items-center justify-between md:hidden">
						<button
							type="button"
							className="p-2"
							onClick={() => setIsMenuOpen(!isMenuOpen)}
						>
							{isMenuOpen ? (
								<X className="h-6 w-6 text-orange-500" />
							) : (
								<Menu className="h-6 w-6 text-orange-500" />
							)}
						</button>

						<a
							href="/"
							onClick={handleLogoClick}
							className="flex flex-1 items-center justify-center transition-opacity hover:opacity-80"
						>
							<Image
								src="/logo-neiji-full.png"
								alt="Neiji Logo"
								width={620}
								height={403}
								className="h-16 w-24"
							/>
							<span className="font-semibold text-3xl text-orange-500">
								Neiji
							</span>
						</a>

						{/* Empty div to maintain spacing */}
						<div className="w-8" />
					</div>

					{/* Desktop Navigation Links */}
					<div className="hidden space-x-8 md:flex">
						<Link
							href="/manifesto"
							className="text-gray-600 hover:text-orange-500"
						>
							Manifesto
						</Link>
						{/* <Link to="/#news" className="text-gray-600 hover:text-orange-500">News</Link> */}
						{/* <Link to="/#manganeiji" className="text-gray-600 hover:text-orange-500">Testing Manga</Link> */}
						<Link
							href="/feedback"
							className="text-gray-600 hover:text-orange-500"
						>
							Feedback
						</Link>
						<Link
							href="/contact"
							className="text-gray-600 hover:text-orange-500"
						>
							Contact
						</Link>
						<Link
							href="/#newsletter"
							className="text-gray-600 hover:text-orange-500"
						>
							Newsletter
						</Link>
					</div>
				</div>

				{/* Mobile Menu */}
				{isMenuOpen && (
					<div className="mt-4 space-y-4 pb-4 md:hidden">
						{/* <Link to="/#manga" className="block text-gray-600 hover:text-orange-500">Story</Link> */}
						{/* <Link to="/#news" className="block text-gray-600 hover:text-orange-500">News</Link> */}
						{/* <Link to="/#manganeiji" className="block text-gray-600 hover:text-orange-500">Testing Manga</Link>/ */}
						<Link
							href="/manifesto"
							className="block text-gray-600 hover:text-orange-500"
						>
							Manifesto
						</Link>
						<Link
							href="/feedback"
							className="block text-gray-600 hover:text-orange-500"
						>
							Feedback
						</Link>
						<Link
							href="/contact"
							className="block text-gray-600 hover:text-orange-500"
						>
							Contact
						</Link>
						<Link
							href="/#newsletter"
							className="block text-gray-600 hover:text-orange-500"
						>
							Newsletter
						</Link>
					</div>
				)}
			</nav>
		</header>
	);
}
