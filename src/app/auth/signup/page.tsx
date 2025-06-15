/**
 * Page d'inscription pour la création de nouveaux comptes utilisateurs
 * 
 * Cette page permet aux nouveaux utilisateurs de créer un compte
 * en fournissant un email et un mot de passe. Un profil utilisateur
 * est automatiquement créé dans la base de données après l'inscription.
 * 
 * Fonctionnalités :
 * - Formulaire d'inscription avec validation
 * - Création automatique du profil utilisateur
 * - Gestion des erreurs d'inscription
 * - Confirmation par email requise
 * - Lien vers la page de connexion
 * 
 * @component
 * @example
 * // Utilisé automatiquement par Next.js pour la route /auth/signup
 * <SignupPage />
 */
"use client";

import { useState } from "react";
import { createClient } from "~/utils/supabase/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useRouter } from "next/navigation";

/**
 * Composant de page d'inscription
 * Gère la création de nouveaux comptes utilisateurs via Supabase Auth
 */
export default function SignupPage() {
	// États pour gérer les données du formulaire et les messages
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [emailError, setEmailError] = useState("");
	
	// Hooks pour la navigation et l'authentification
	const router = useRouter();	const supabase = createClient();

	/**
	 * Valide le format de l'email
	 * 
	 * @param email - Email à valider
	 * @returns string - Message d'erreur ou chaîne vide si valide
	 */
	const validateEmail = (email: string): string => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email) {
			return "L'email est requis";
		}
		if (!emailRegex.test(email)) {
			return "Veuillez entrer un email valide";
		}
		return "";
	};

	/**
	 * Valide le format du mot de passe selon les critères définis
	 * 
	 * @param password - Mot de passe à valider
	 * @returns string - Message d'erreur ou chaîne vide si valide
	 */
	const validatePassword = (password: string): string => {
		if (password.length < 6) {
			return "Le mot de passe doit contenir au moins 6 caractères";
		}
		if (!/(?=.*[a-z])/.test(password)) {
			return "Le mot de passe doit contenir au moins une lettre minuscule";
		}
		if (!/(?=.*[A-Z])/.test(password)) {
			return "Le mot de passe doit contenir au moins une lettre majuscule";
		}
		if (!/(?=.*\d)/.test(password)) {
			return "Le mot de passe doit contenir au moins un chiffre";
		}
		return "";
	};
	/**
	 * Gère le changement de mot de passe avec validation en temps réel
	 * 
	 * @param value - Nouvelle valeur du mot de passe
	 */
	const handlePasswordChange = (value: string) => {
		setPassword(value);
		setPasswordError(validatePassword(value));
	};

	/**
	 * Gère le changement d'email avec validation en temps réel
	 * 
	 * @param value - Nouvelle valeur de l'email
	 */
	const handleEmailChange = (value: string) => {
		setEmail(value);
		setEmailError(validateEmail(value));
	};

	/**
	 * Gère la soumission du formulaire d'inscription
	 * Crée un nouveau compte utilisateur et son profil associé
	 * 
	 * @param e - Événement de soumission du formulaire
	 * @returns Promise<void>
	 */
	const handleSignup = async (e: React.FormEvent) => {		e.preventDefault();
		setIsLoading(true);
		setError("");
		setMessage("");

		// Validation des champs avant soumission
		const emailValidationError = validateEmail(email);
		const passwordValidationError = validatePassword(password);
		
		if (emailValidationError) {
			setEmailError(emailValidationError);
			setIsLoading(false);
			return;
		}
		
		if (passwordValidationError) {
			setPasswordError(passwordValidationError);
			setIsLoading(false);
			return;
		}
		try {
			// Création du compte utilisateur avec Supabase Auth
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
			});

			if (error) {
				setError(error.message);
			} else {
				// Création du profil utilisateur dans la base de données
				if (data.user) {
					await createUserProfile(data.user.email!);
				}
						// Redirection automatique vers le questionnaire après inscription réussie
				setMessage("Création du compte réussie. Redirection vers le questionnaire...");
				router.push("/protected/questionnaire");
			}
		} catch (err) {
			setError("Une erreur s'est produite");
		} finally {
			setIsLoading(false);
		}};
	/**
	 * Crée un profil utilisateur dans la table users_table
	 * Initialise les champs de mémoire IA pour le nouveau utilisateur
	 * 
	 * @param email - Email de l'utilisateur pour lequel créer le profil
	 * @returns Promise<void>
	 */	const createUserProfile = async (email: string) => {
		try {			// Insertion du profil utilisateur avec les champs de mémoire IA initialisés
			const { error } = await supabase
				.from("users_table")
				.insert([
					{
						email,
						memory_L0: "", // Mémoire immédiate
						memory_L1: "", // Mémoire court terme
						memory_L2: "", // Mémoire long terme
						questionnaire: {}, // Profil de personnalité pour l'entraînement de l'IA (objet JSON vide)
					},
				]);

			if (error) {
				console.error("Erreur lors de la création du profil:", error);
			}
		} catch (err) {
			console.error("Erreur:", err);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-6 rounded-lg border p-6">
				<h1 className="text-center text-2xl font-bold">Inscription</h1>
						<form onSubmit={handleSignup} className="space-y-4">
					<div>
						<Input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => handleEmailChange(e.target.value)}
							required
						/>
						{emailError && (
							<div className="text-red-500 text-xs mt-1">{emailError}</div>
						)}
					</div>
					
                    <div>
                        <Input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            required
                        />
                        {passwordError && (
                            <div className="text-red-500 text-xs mt-1">{passwordError}</div>
                        )}
                        <div className="text-gray-500 text-xs mt-1">
                            Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule et un chiffre
                        </div>
                    </div>

					{error && (
						<div className="text-red-500 text-sm">{error}</div>
					)}

					{message && (
						<div className="text-green-500 text-sm">{message}</div>
					)}					<Button 
						type="submit" 
						className="w-full" 
						disabled={isLoading || passwordError !== "" || emailError !== ""}
					>
						{isLoading ? "Inscription..." : "S'inscrire"}
					</Button>
				</form>

				<div className="text-center">
					<a href="/auth/login" className="text-blue-500 hover:underline">
						Déjà un compte ? Se connecter
					</a>
				</div>
			</div>
		</div>
	);
}
