"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Menu, X } from "lucide-react";

export default function LandingLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen">
			<Header />
			<div className="pt-30">{children}</div>
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
		<header className="fixed z-50 w-full bg-white/90 backdrop-blur-md">
			<nav className="flex h-30 items-center justify-between px-10">
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
				</div>				{/* Desktop Navigation Links */}
				<div className="hidden space-x-8 md:flex">
					<Link
						href="/manifesto"
						className="text-gray-600 hover:text-orange-500"
					>
						Manifesto
					</Link>
					<Link href="/ask" className="text-gray-600 hover:text-orange-500">
						Chat
					</Link>
					<Link href="/contact" className="text-gray-600 hover:text-orange-500">
						Contact
					</Link>
					<Link
						href="/#newsletter"
						className="text-gray-600 hover:text-orange-500"
					>
						Newsletter
					</Link>
					<Link
						href="/auth/login"
						className="text-gray-600 hover:text-orange-500"
					>
						Connexion
					</Link>
				</div>

				{/* Mobile Menu */}
				<AnimatePresence>
					{isMenuOpen && (
						<motion.nav
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.3 }}
							className="fixed top-24 right-0 left-0 z-50 mx-4 space-y-3 rounded-xl bg-white px-4 pb-6 shadow-md md:hidden"
						>
							<Link
								href="/manifesto"
								onClick={() => setIsMenuOpen(false)}
								className="block font-medium text-gray-800 transition-colors duration-200 hover:text-orange-500"
							>
								Manifesto
							</Link>
							<Link
								href="/ask"
								onClick={() => setIsMenuOpen(false)}
								className="block font-medium text-gray-800 transition-colors duration-200 hover:text-orange-500"
							>
								Chat
							</Link>
							<Link
								href="/contact"
								onClick={() => setIsMenuOpen(false)}
								className="block font-medium text-gray-800 transition-colors duration-200 hover:text-orange-500"
							>
								Contact
							</Link>							<Link
								href="/#newsletter"
								onClick={() => setIsMenuOpen(false)}
								className="block font-medium text-gray-800 transition-colors duration-200 hover:text-orange-500"
							>
								Newsletter
							</Link>
							<Link
								href="/auth/login"
								onClick={() => setIsMenuOpen(false)}
								className="block font-medium text-gray-800 transition-colors duration-200 hover:text-orange-500"
							>
								Connexion
							</Link>
						</motion.nav>
					)}
				</AnimatePresence>
			</nav>
		</header>
	);
}
