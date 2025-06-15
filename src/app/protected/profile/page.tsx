/**
 * @fileoverview Page de profil utilisateur
 * 
 * Cette page affiche les informations du profil utilisateur incluant
 * les réponses du questionnaire de personnalité et permet de les modifier.
 * 
 * @component ProfilePage
 * @description Page de profil avec récapitulatif du questionnaire
 * 
 * Fonctionnalités principales :
 * - Affichage des réponses du questionnaire
 * - Possibilité de refaire le questionnaire
 * - Interface responsive et moderne
 * - Redirection vers questionnaire si non complété
 * 
 * @author Neiji Team
 * @version 1.0.0
 * @since 2025
 */

"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { createClient } from "~/utils/supabase/client";
import { useRouter } from "next/navigation";

// Interface pour les données du profil
interface ProfileData {
	email: string;
	questionnaire?: QuestionnaireAnswers;
}

// Interface pour les réponses du questionnaire
interface QuestionnaireAnswers {
	[key: string]: string; // Clés descriptives comme "age", "metier", etc.
}

export default function ProfilePage() {
	const [profileData, setProfileData] = useState<ProfileData | null>(null);
	const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const supabase = createClient();
	// Questions du questionnaire avec leurs clés descriptives
	const questions = [
		{ id: 1, key: "age", question: "Quel âge as-tu ?" },
		{ id: 2, key: "metier", question: "Dans quel domaine tu travailles ou tu étudies ?" },
		{ id: 3, key: "objectif", question: "Quel est ton objectif principal en ce moment ?" },
		{ id: 4, key: "travail_preference", question: "Tu préfères travailler seul(e) ou en équipe ?" },
		{ id: 5, key: "rythme", question: "Tu es plutôt du matin ou du soir ?" },
		{ id: 6, key: "personnalite", question: "Comment tu décrirais ta personnalité en quelques mots ?" },
		{ id: 7, key: "intro_extro", question: "Tu te considères plutôt introverti(e) ou extraverti(e) ?" },
		{ id: 8, key: "communication", question: "Quel style de communication tu préfères ?" },
		{ id: 9, key: "motivation", question: "Qu'est-ce qui te motive le plus dans la vie ?" },
		{ id: 10, key: "gestion_stress", question: "Comment tu gères le stress ?" },
		{ id: 11, key: "prise_decision", question: "Comment tu prends tes décisions importantes ?" },
		{ id: 12, key: "autre", question: "Y a-t-il autre chose d'important que je devrais savoir sur toi ?" }
	];

	// Chargement des données du profil
	useEffect(() => {
		const loadProfileData = async () => {
			try {
				const { data: { user }, error: userError } = await supabase.auth.getUser();				if (userError || !user || !user.email) {
					router.push("/auth/login");
					return;
				}

				// Récupération des données utilisateur
				const { data, error } = await supabase
					.from("users_table")
					.select("email, questionnaire")
					.eq("email", user.email)
					.single();

				if (error) {
					console.error("Erreur lors du chargement du profil:", error);					// Si l'utilisateur n'existe pas dans la table (PGRST116), rediriger vers questionnaire
					if (error.code === 'PGRST116') {
						router.push("/protected/questionnaire");
						return;
					}
					// Pour les autres erreurs, créer un profil basique
					setProfileData({ email: user.email });} else if (data) {
					setProfileData(data);
					
					// Si pas de questionnaire ou objet vide, rediriger vers questionnaire
					if (!data.questionnaire || Object.keys(data.questionnaire).length === 0) {
						router.push("/protected/questionnaire");
						return;
					}					// Parser la string JSON en objet
					let parsedAnswers = data.questionnaire;
					if (typeof data.questionnaire === 'string') {
						try {
							parsedAnswers = JSON.parse(data.questionnaire);
						} catch (e) {
							console.error("Erreur lors du parsing du questionnaire:", e);
							parsedAnswers = {};
						}
					}
					
					setAnswers(parsedAnswers);} else {
					// Aucune donnée trouvée, rediriger vers questionnaire
					router.push("/protected/questionnaire");
					return;
				}
			} catch (err) {
				console.error("Erreur:", err);
			} finally {
				setIsLoading(false);
			}
		};

		loadProfileData();
	}, [router, supabase]);

	const handleRedoQuestionnaire = () => {
		router.push("/protected/questionnaire");
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-orange-100 to-orange-200">
				<div className="text-lg">Chargement de votre profil...</div>
			</div>
		);
	}

	if (!profileData) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-orange-100 to-orange-200">
				<div className="text-lg text-red-600">Erreur lors du chargement du profil</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-white via-orange-100 to-orange-200 p-4">
			<div className="mx-auto max-w-4xl">
				{/* Header */}
				<div className="mb-8 text-center">
					<div className="mb-4 h-20 w-20 mx-auto">
						<img
							src="/NeijiHeadLogo1.4.png"
							alt="Neiji"
							className="h-full w-full object-contain"
						/>
					</div>
					<h1 className="mb-2 font-bold text-3xl text-gray-800">Mon Profil</h1>
					<p className="text-gray-600">Voici un récapitulatif de tes informations</p>
				</div>				{/* Informations générales */}
				<div className="mb-8 rounded-xl bg-white p-6 shadow-lg">
					<h2 className="mb-4 font-semibold text-xl text-gray-800">Informations générales</h2>					<div className="grid gap-4 md:grid-cols-1">
						<div>
							<label className="block font-medium text-gray-700 text-sm">Email</label>
							<p className="mt-1 text-gray-900">{profileData.email}</p>
						</div>
					</div>				</div>

				{/* Réponses du questionnaire */}
				<div className="mb-8 rounded-xl bg-white p-6 shadow-lg">
					<div className="mb-6 flex items-center justify-between">
						<h2 className="font-semibold text-xl text-gray-800">Questionnaire de personnalité</h2>
						<button
							onClick={handleRedoQuestionnaire}
							className="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
						>
							Refaire le questionnaire
						</button>
					</div>					{Object.keys(answers).length === 0 ? (
						<div className="text-center">
							<p className="mb-4 text-gray-600">Aucune réponse de questionnaire trouvée</p>
							<button
								onClick={handleRedoQuestionnaire}
								className="rounded-lg bg-orange-500 px-6 py-3 text-white transition-colors hover:bg-orange-600"
							>
								Commencer le questionnaire
							</button>
						</div>					) : (
						<div className="space-y-6">
							{questions.map((question) => {
								const answer = answers[question.key]; // Utiliser la clé descriptive
								
								if (!answer) {
									return null;
								}

								return (									<div key={question.key} className="border-l-4 border-orange-500 pl-4">
										<h3 className="mb-2 font-medium text-gray-800">
											{question.question}
										</h3>
										<p className="text-gray-700">
											{answer}
										</p>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="flex justify-center space-x-4">
					<button
						onClick={() => router.push("/protected/chat")}
						className="rounded-lg bg-orange-500 px-6 py-3 text-white transition-colors hover:bg-orange-600"
					>
						Aller au Chat
					</button>
					<button
						onClick={() => router.push("/protected")}
						className="rounded-lg border border-orange-500 px-6 py-3 text-orange-500 transition-colors hover:bg-orange-50"
					>
						Retour au tableau de bord
					</button>
				</div>
			</div>
		</div>
	);
}
