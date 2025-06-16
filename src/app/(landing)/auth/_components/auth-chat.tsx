"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "~/utils/supabase/client";

import { BotMessage } from "../../chat/_components/bot-message";
import { UserMessage } from "../../chat/_components/user-message";
import { ChatInput } from "../../chat/_components/chat-input";

// Composant simple pour l'input d'auth
function AuthInput({ 
	onSend, 
	disabled, 
	placeholder,
	isPassword = false
}: { 
	onSend: (input: string) => void; 
	disabled: boolean; 
	placeholder: string;
	isPassword?: boolean;
}) {
	const [input, setInput] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (input.trim() && !disabled) {
			onSend(input.trim());
			setInput("");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2 w-full">
			<input
				type={isPassword ? "password" : "text"}
				value={input}
				onChange={(e) => setInput(e.target.value)}
				placeholder={placeholder}
				disabled={disabled}
				className="flex-1 px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
			/>
			<button
				type="submit"
				disabled={disabled || !input.trim()}
				className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Envoyer
			</button>
		</form>
	);
}

interface AuthChatProps {
	authStep: 'welcome' | 'email' | 'password' | 'signup';
	setAuthStep: (step: 'welcome' | 'email' | 'password' | 'signup') => void;
	authData: {
		email: string;
		password: string;
		isExistingUser: boolean;
	};
	setAuthData: React.Dispatch<React.SetStateAction<{
		email: string;
		password: string;
		isExistingUser: boolean;
	}>>;
	authMessages: Array<{
		id: string;
		role: 'user' | 'assistant';
		content: string;
	}>;
	setAuthMessages: React.Dispatch<React.SetStateAction<Array<{
		id: string;
		role: 'user' | 'assistant';
		content: string;
	}>>>;
}

export function AuthChat({ 
	authStep, 
	setAuthStep, 
	authData, 
	setAuthData, 
	authMessages, 
	setAuthMessages 
}: AuthChatProps) {
	const router = useRouter();
	const supabase = createClient();
	const [isLoading, setIsLoading] = useState(false);

	// Debug: Log pour vérifier que le composant se charge
	useEffect(() => {
		console.log('AuthChat rendered with:', { authStep, authMessages: authMessages.length });
	}, [authStep, authMessages]);

	const addMessage = (role: 'user' | 'assistant', content: string) => {
		const newMessage = {
			id: `auth-${Date.now()}-${Math.random()}`,
			role,
			content
		};
		console.log('Adding message:', newMessage);
		setAuthMessages((prev) => [...prev, newMessage]);
		return newMessage;
	};

	const handleUserInput = async (input: string) => {
		// Ajouter le message utilisateur
		addMessage('user', input);
		setIsLoading(true);

		try {
			if (authStep === 'welcome') {
				// L'utilisateur répond à la question de connexion
				if (input.toLowerCase().includes('oui') || input.toLowerCase().includes('connect') || input.toLowerCase().includes('connexion')) {
					addMessage('assistant', 'Parfait ! Quelle est votre adresse email ?');
					setAuthStep('email');
				} else {
					addMessage('assistant', 'Aucun problème ! Vous pouvez utiliser le chat en mode invité. Si vous changez d\'avis, tapez "connexion" à tout moment.');
				}
			} else if (authStep === 'email') {
				// Vérifier si l'email est valide
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(input)) {
					addMessage('assistant', 'Hmm, cet email ne semble pas valide. Pouvez-vous le retaper ? (exemple: nom@exemple.com)');
					return;
				}

				setAuthData(prev => ({ ...prev, email: input }));

				// Vérifier si l'utilisateur existe
				const { data: existingUser } = await supabase
					.from('users_table')
					.select('email')
					.eq('email', input)
					.single();

				if (existingUser) {
					// Utilisateur existant
					setAuthData(prev => ({ ...prev, isExistingUser: true }));
					addMessage('assistant', `Bonjour ! Je vous reconnais. Quel est votre mot de passe ?`);
					setAuthStep('password');
				} else {
					// Nouvel utilisateur
					setAuthData(prev => ({ ...prev, isExistingUser: false }));
					addMessage('assistant', `Je ne vous connais pas encore ! Créons votre compte. Choisissez un mot de passe sécurisé (au moins 8 caractères avec lettres et chiffres).`);
					setAuthStep('signup');
				}
			} else if (authStep === 'password') {
				// Connexion
				const { error } = await supabase.auth.signInWithPassword({
					email: authData.email,
					password: input
				});

				if (error) {
					addMessage('assistant', 'Oups ! Ce mot de passe ne correspond pas. Pouvez-vous réessayer ?');
				} else {
					addMessage('assistant', 'Parfait ! Connexion réussie. Bienvenue dans votre espace personnel ! 🎉');
					setTimeout(() => {
						router.push('/protected/chat');
					}, 2000);
				}
			} else if (authStep === 'signup') {
				// Validation du mot de passe
				if (input.length < 8) {
					addMessage('assistant', 'Ce mot de passe est trop court. Il doit contenir au moins 8 caractères. Essayez encore !');
					return;
				}
				if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(input)) {
					addMessage('assistant', 'Votre mot de passe doit contenir à la fois des lettres et des chiffres pour plus de sécurité. Réessayez !');
					return;
				}

				// Créer le compte
				const { error } = await supabase.auth.signUp({
					email: authData.email,
					password: input
				});

				if (error) {
					addMessage('assistant', `Désolé, il y a eu un problème : ${error.message}. Pouvez-vous réessayer ?`);
				} else {
					addMessage('assistant', 'Excellent ! Votre compte a été créé. Bienvenue dans la communauté Neiji ! 🌟');
					setTimeout(() => {
						router.push('/protected/chat');
					}, 2000);				}
			}
		} catch (error) {
			addMessage('assistant', 'Oups ! Il y a eu un petit problème technique. Pouvez-vous réessayer ?');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			{/* Messages d'authentification */}
			{authMessages.map((message, index) => {
				if (message.role === "user") {
					return (
						<UserMessage key={message.id}>{message.content}</UserMessage>
					);
				}

				return <BotMessage key={message.id} message={message} />;
			})}
			
			{isLoading && (
				<div className="animate-in fade-in duration-300">
					<BotMessage message={{
						id: 'loading',
						role: 'assistant',
						content: 'En train de réfléchir...'
					}} />
				</div>
			)}

			{/* Input d'authentification - utilise le même style que ChatInput mais avec logique custom */}
			<div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm">
				<div className="container mx-auto max-w-2xl p-4">
					<AuthInput 
						onSend={handleUserInput}
						disabled={isLoading}
						isPassword={authStep === 'password' || authStep === 'signup'}
						placeholder={
							authStep === 'welcome' ? "Tapez 'oui' pour vous connecter..." :
							authStep === 'email' ? "Votre adresse email..." :
							authStep === 'password' ? "Votre mot de passe..." :
							authStep === 'signup' ? "Choisissez un mot de passe..." :
							"Tapez votre message..."
						}
					/>
				</div>
			</div>
		</>
	);
}
