/**
 * @fileoverview Layout de protection pour les pages authentifiées de l'application Neiji
 * 
 * Ce composant fournit un layout protégé qui vérifie l'authentification de l'utilisateur
 * avant d'afficher le contenu. Il inclut également une barre de navigation avec les
 * principales sections de l'application et un menu utilisateur avec déconnexion.
 * 
 * @component ProtectedLayout
 * @description Layout wrapper qui assure la protection par authentification
 * 
 * Fonctionnalités principales :
 * - Vérification automatique de l'authentification utilisateur
 * - Redirection vers login si non authentifié
 * - Navigation principale avec liens vers Dashboard, Chat et Ask
 * - Menu utilisateur avec email affiché et bouton de déconnexion
 * - Interface responsive avec affichage conditionnel sur mobile
 * 
 * @author Neiji Team
 * @version 1.0.0
 * @since 2025
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "~/utils/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

/**
 * Interface pour les props du ProtectedLayout
 */
interface ProtectedLayoutProps {
	children: React.ReactNode;
}

/**
 * Composant de layout pour l'espace protégé
 * Gère l'authentification et fournit la structure de navigation
 */
export default function ProtectedLayout({
	children,
}: ProtectedLayoutProps) {
	// États pour gérer l'utilisateur et le chargement
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
	
	// Hooks pour la navigation et l'authentification
	const router = useRouter();
	const supabase = createClient();
	useEffect(() => {
		/**
		 * Vérifie l'authentification de l'utilisateur
		 * Redirige vers la page de connexion si non authentifié
		 * Bypass pour développeurs en mode développement
		 */		
		const getUser = async () => {
			// Bypass pour développeurs en mode développement
			if (process.env.NODE_ENV === 'development') {
				// Vous pouvez créer un utilisateur mockup pour le développement
				const isDeveloper = localStorage.getItem('neiji_dev_mode') === 'true';
				if (isDeveloper) {
					setUser({
						id: 'dev-user',
						email: 'dev@neiji.com',
						// ...autres propriétés mockées
					} as User);
					setLoading(false);
					return;
				}
			}

			// Récupération des données utilisateur depuis Supabase
			const { data: { user } } = await supabase.auth.getUser();
			
			// Redirection si utilisateur non authentifié - utilise notre système d'auth conversationnel
			if (!user) {
				router.push("/auth");
				return;
			}

			setUser(user);
			setLoading(false);
		};

		getUser();
	}, [router, supabase]);	/**
	 * Gère la déconnexion de l'utilisateur
	 * Supprime la session et redirige vers la page d'accueil
	 */
	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/chat"); // Retourne au chat landing au lieu de forcer la connexion
	};

	/**
	 * Gère le clic sur le logo pour retourner au tableau de bord
	 */
	const handleLogoClick = (e: React.MouseEvent) => {
		e.preventDefault();
		router.push("/protected");
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-lg">Chargement...</div>
			</div>
		);
	}
	return (
		<div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
			<header className="fixed z-50 w-full bg-white/90 backdrop-blur-md">
				<nav className="flex h-30 items-center justify-between px-10">
					{/* Desktop Version */}
					<div className="hidden items-center space-x-8 md:flex">
						<a
							href="/protected"
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
							href="/protected"
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
					</div>					{/* Desktop Navigation Links */}
					<div className="hidden space-x-8 md:flex">
						<Link
							href="/protected"
							className="text-gray-600 hover:text-orange-500"
						>
							Tableau de bord
						</Link>
						<Link
							href="/protected/chat"
							className="text-gray-600 hover:text-orange-500"
						>
							Chat
						</Link>						<Link
							href="/protected/profile"
							className="text-gray-600 hover:text-orange-500"
						>
							Profil
						</Link>
						<button
							type="button"
							onClick={handleSignOut}
							className="text-gray-600 hover:text-orange-500"
						>
							Déconnexion
						</button>
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
							>								<Link
									href="/protected"
									onClick={() => setIsMenuOpen(false)}
									className="block font-medium text-gray-800 transition-colors duration-200 hover:text-orange-500"
								>
									Tableau de bord
								</Link>
								<Link
									href="/protected/chat"
									onClick={() => setIsMenuOpen(false)}
									className="block font-medium text-gray-800 transition-colors duration-200 hover:text-orange-500"
								>
									Chat
								</Link>								<Link
									href="/protected/profile"
									onClick={() => setIsMenuOpen(false)}
									className="block font-medium text-gray-800 transition-colors duration-200 hover:text-orange-500"
								>
									Profil
								</Link>
								<button
									type="button"
									onClick={() => {
										setIsMenuOpen(false);
										handleSignOut();
									}}
									className="block w-full text-left font-medium text-gray-800 transition-colors duration-200 hover:text-orange-500"
								>
									Déconnexion
								</button>
							</motion.nav>
						)}
					</AnimatePresence>
				</nav>
			</header>
			<div className="pt-30">{children}</div>
		</div>
	);
}
