/**
 * Page de connexion pour l'authentification des utilisateurs
 * 
 * Cette page permet aux utilisateurs existants de se connecter à leur compte
 * en utilisant leur email et mot de passe. Après une connexion réussie,
 * l'utilisateur est redirigé vers l'espace protégé de l'application.
 * 
 * Fonctionnalités :
 * - Formulaire de connexion avec validation
 * - Gestion des erreurs d'authentification
 * - Redirection automatique après connexion
 * - Lien vers la page d'inscription
 * 
 * @component
 * @example
 * // Utilisé automatiquement par Next.js pour la route /auth/login
 * <LoginPage />
 */
"use client";

import { useState } from "react";
import { createClient } from "~/utils/supabase/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useRouter } from "next/navigation";

/**
 * Composant de page de connexion
 * Gère l'authentification des utilisateurs via Supabase Auth
 */
export default function LoginPage() {
	// États pour gérer les données du formulaire
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [emailError, setEmailError] = useState("");
	
	// Hooks pour la navigation et l'authentification
	const router = useRouter();
	const supabase = createClient();

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
	 * Gère le changement d'email avec validation en temps réel
	 * 
	 * @param value - Nouvelle valeur de l'email
	 */
	const handleEmailChange = (value: string) => {
		setEmail(value);
		setEmailError(validateEmail(value));
	};

	/**
	 * Gère la soumission du formulaire de connexion
	 * 
	 * @param e - Événement de soumission du formulaire
	 * @returns Promise<void>
	 */	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		// Validation de l'email avant soumission
		const emailValidationError = validateEmail(email);
		if (emailValidationError) {
			setEmailError(emailValidationError);
			setIsLoading(false);
			return;
		}

		try {
			// Tentative de connexion avec Supabase Auth
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				setError(error.message);
			} else {
				// Redirection vers l'espace protégé après connexion réussie
				router.push("/protected");
			}
		} catch (err) {
			setError("Une erreur s'est produite");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-6 rounded-lg border p-6">
				<h1 className="text-center text-2xl font-bold">Connexion</h1>
						<form onSubmit={handleLogin} className="space-y-4">
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
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					{error && (
						<div className="text-red-500 text-sm">{error}</div>
					)}

					<Button 
						type="submit" 
						className="w-full" 
						disabled={isLoading || emailError !== ""}
					>
						{isLoading ? "Connexion..." : "Se connecter"}
					</Button>
				</form>

				<div className="text-center">
					<a href="/auth/signup" className="text-blue-500 hover:underline">
						Pas de compte ? S'inscrire
					</a>
				</div>
			</div>
		</div>
	);
}
