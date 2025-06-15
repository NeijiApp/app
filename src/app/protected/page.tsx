/**
 * @fileoverview Page principale du tableau de bord protégé de l'application Neiji
 * 
 * Cette page constitue le centre de contrôle principal pour les utilisateurs authentifiés.
 * Elle affiche les informations utilisateur et permet la gestion des mémoires IA à différents niveaux.
 * 
 * @component ProtectedPage
 * @description Tableau de bord principal avec gestion des mémoires IA
 * 
 * Fonctionnalités principales :
 * - Affichage des informations utilisateur (email, ID)
 * - Interface de gestion des mémoires IA multi-niveaux :
 *   • L0 : Mémoire immédiate (court terme)
 *   • L1 : Mémoire intermédiaire 
 *   • L2 : Mémoire à long terme
 * - Mise à jour en temps réel des mémoires dans la base de données
 * - Vérification automatique de l'authentification
 * - Bouton de déconnexion intégré
 * 
 * @requires supabase/client - Client Supabase pour l'authentification et la base de données
 * @requires react - Hooks useState et useEffect pour la gestion d'état
 * @requires next/navigation - Router Next.js pour la navigation
 * 
 * États gérés :
 * - user : Informations de l'utilisateur authentifié
 * - userProfile : Profil utilisateur avec mémoires IA
 * - loading : État de chargement des données
 * 
 * @author Neiji Team
 * @version 1.0.0
 * @since 2025
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "~/utils/supabase/client";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

/**
 * Composant principal du tableau de bord protégé
 * 
 * @returns {JSX.Element} Interface du tableau de bord avec gestion des mémoires IA
 */
export default function ProtectedPage() {
	const [user, setUser] = useState<User | null>(null);
	const [userProfile, setUserProfile] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const supabase = createClient();

	useEffect(() => {
		/**
		 * Récupère les informations de l'utilisateur authentifié et son profil
		 * Redirige vers la page de connexion si non authentifié
		 */
		const getUser = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user) {
				router.push("/auth/login");
				return;
			}

			setUser(user);

			// Récupérer le profil utilisateur depuis votre table
			const { data: profile } = await supabase
				.from("users_table")
				.select("*")
				.eq("email", user.email)
				.single();

			setUserProfile(profile);
			setLoading(false);
		};
		getUser();
	}, [router, supabase]);

	/**
	 * Gère la déconnexion de l'utilisateur
	 * Supprime la session et redirige vers la page de connexion
	 */
	const handleLogout = async () => {
		await supabase.auth.signOut();		router.push("/auth/login");
	};

	/**
	 * Met à jour une mémoire IA spécifique dans la base de données
	 * 
	 * @param {string} level - Niveau de mémoire (memory_L0, memory_L1, memory_L2)
	 * @param {string} content - Nouveau contenu de la mémoire
	 */
	const updateMemory = async (level: string, content: string) => {
		if (!user) return;

		const { error } = await supabase
			.from("users_table")
			.update({ [level]: content })
			.eq("email", user.email);

		if (!error) {
			// Recharger le profil
			const { data: profile } = await supabase
				.from("users_table")
				.select("*")
				.eq("email", user.email)
				.single();
			setUserProfile(profile);
		}
	};

	if (loading) {
		return <div className="flex min-h-screen items-center justify-center">Chargement...</div>;
	}

	return (
		<div className="min-h-screen p-8">
			<div className="mx-auto max-w-4xl">			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Tableau de bord Neiji</h1>
				<Button onClick={handleLogout} variant="outline">
					Déconnexion
				</Button>
			</div>

				<div className="grid gap-6">
					<div className="rounded-lg border p-6">
						<h2 className="text-xl font-semibold mb-4">Informations utilisateur</h2>
						<p><strong>Email:</strong> {user?.email}</p>
						<p><strong>ID:</strong> {user?.id}</p>
					</div>

					{userProfile && (
						<div className="rounded-lg border p-6">
							<h2 className="text-xl font-semibold mb-4">Mémoires IA</h2>
							
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium mb-1">
										Mémoire immédiate (L0)
									</label>
									<textarea
										className="w-full p-2 border rounded"
										rows={3}
										value={userProfile.memory_L0 || ""}
										onChange={(e) => updateMemory("memory_L0", e.target.value)}
										placeholder="Mémoire à court terme..."
									/>
								</div>

								<div>
									<label className="block text-sm font-medium mb-1">
										Mémoire court terme (L1)
									</label>
									<textarea
										className="w-full p-2 border rounded"
										rows={3}
										value={userProfile.memory_L1 || ""}
										onChange={(e) => updateMemory("memory_L1", e.target.value)}
										placeholder="Mémoire intermédiaire..."
									/>
								</div>

								<div>
									<label className="block text-sm font-medium mb-1">
										Mémoire long terme (L2)
									</label>
									<textarea
										className="w-full p-2 border rounded"
										rows={3}
										value={userProfile.memory_L2 || ""}
										onChange={(e) => updateMemory("memory_L2", e.target.value)}
										placeholder="Mémoire à long terme..."
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
