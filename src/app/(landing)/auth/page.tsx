"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "~/utils/supabase/client";

import { BotMessage } from "../chat/_components/bot-message";
import { Chat } from "../chat/_components/chat";
import { GradientBackground } from "../chat/_components/gradient-background";
import { UserMessage } from "../chat/_components/user-message";
import { AuthInput } from "./_components/auth-input";

// Logique d'authentification (équivalent à ChatLogic)
function AuthLogic() {
	const router = useRouter();
	const supabase = createClient();
	
	const [authStep, setAuthStep] = useState<'welcome' | 'email' | 'password' | 'signup'>('welcome');
	const [authData, setAuthData] = useState({
		email: '',
		password: '',
		isExistingUser: false
	});
	const [isLoading, setIsLoading] = useState(false);
	
	// Messages d'authentification (équivalent à allMessages)
	const [authMessages, setAuthMessages] = useState<Array<{
		id: string;
		role: 'user' | 'assistant';
		content: string;
	}>>([
		{
			id: 'auth-welcome',
			role: 'assistant' as const,
			content: 'Bonjour ! Je suis Neiji, votre assistant de méditation. Pour accéder à toutes les fonctionnalités, souhaitez-vous vous connecter ?'
		}
	]);

	// Auto-scroll (même logique que le chat)
	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null;

		const scrollToBottom = () => {
			window.scrollTo({
				top: document.documentElement.scrollHeight,
				behavior: "smooth",
			});
		};

		// Start auto-scrolling when loading
		if (isLoading) {
			scrollToBottom();
			intervalId = setInterval(scrollToBottom, 100);
		}

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [isLoading]);

	const addMessage = (role: 'user' | 'assistant', content: string) => {
		const newMessage = {
			id: `auth-${Date.now()}-${Math.random()}`,
			role,
			content
		};
		setAuthMessages((prev) => [...prev, newMessage]);
		return newMessage;
	};	// Fonction pour détecter si l'utilisateur veut se connecter
	const detectPositiveResponse = (input: string): boolean => {
		const normalizedInput = input.toLowerCase().trim();
		console.log('✅ Début détection positive pour:', `"${normalizedInput}"`);
		
		// Test le plus simple d'abord - juste "oui"
		if (normalizedInput === 'oui') {
			console.log('✅ Match exact "oui" trouvé');
			return true;
		}
		
		// Variantes de "oui" en français (sans les mots ambigus)
		const positiveVariants = [
			'ui', 'oiu', 'ouai', 'ouais', 'ouaip', 'ok', 'okay', 'okey',
			'yes', 'yep', 'yeah', 'yess', 'ye', 'bien', 'parfait',
			'daccord', "d'accord", 'dacord', 'vas-y', 'vas y', 'go', 'gogogo',
			'connect', 'connexion', 'connecter', 'login', 'signin', 'sign in',
			'connecte', 'connecté', 'je veux', 'jveux', 'allons-y', 'allez',
			'bien sur', 'bien sûr', 'evidemment', 'évidemment', 'of course',
			'pourquoi pas', 'why not', 'avec plaisir', 'volontiers', 'banco'
		];

		// Vérifier si l'input correspond à une variante
		for (const variant of positiveVariants) {
			if (normalizedInput === variant) {
				console.log('✅ Match positif exact trouvé:', variant);
				return true;
			}
			if (normalizedInput.includes(variant)) {
				console.log('✅ Match positif par inclusion trouvé:', variant);
				return true;
			}
			// Gérer les fautes de frappe courantes avec distance de Levenshtein simple
			if (variant.length > 2 && isCloseMatch(normalizedInput, variant)) {
				console.log('✅ Match positif fuzzy trouvé:', variant);
				return true;
			}
		}
		
		console.log('✅ Aucun match positif trouvé');
		return false;
	};// Fonction pour détecter si l'utilisateur refuse de se connecter
	const detectNegativeResponse = (input: string): boolean => {
		const normalizedInput = input.toLowerCase().trim();
		console.log('🚫 Début détection négative pour:', `"${normalizedInput}"`);
		
		// Test le plus simple d'abord - juste "non"
		if (normalizedInput === 'non') {
			console.log('🚫 Match exact "non" trouvé');
			return true;
		}
		
		// Variantes de "non" en français et anglais - vérification stricte d'abord
		const negativeVariants = [
			'no', 'nop', 'nope', 'nn', 'nah', 'nan', 'naan', 'niet', 'nein',
			'pas', 'jamais', 'never', 'pas question', 'hors de question', 'aucun',
			'refuse', 'refus', 'decline', 'skip', 'passer', 'plus tard',
			'later', 'not now', 'pas maintenant', 'pas envie', 'bof', 'mouais',
			'non merci', 'no thanks', 'no thank you', 'ça va', 'ca va', 'ça ira',
			'leave', 'quit', 'exit', 'sortir', 'partir', 'retour', 'back',
			'annuler', 'cancel', 'abort', 'stop', 'arrêt', 'arret'
		];

		// Test strict d'abord (correspondance exacte et inclusion)
		for (const variant of negativeVariants) {
			if (normalizedInput === variant) {
				console.log('🚫 Match exact trouvé:', variant);
				return true;
			}
			if (normalizedInput.includes(variant)) {
				console.log('🚫 Match par inclusion trouvé:', variant);
				return true;
			}
		}

		// Puis test avec Levenshtein seulement pour les mots longs
		for (const variant of negativeVariants) {
			if (variant.length > 3 && isCloseMatch(normalizedInput, variant)) {
				console.log('🚫 Match fuzzy trouvé:', variant);
				return true;
			}
		}
		
		console.log('🚫 Aucun match négatif trouvé');
		return false;
	};

	// Fonction simple pour détecter les fautes de frappe (distance de 1-2 caractères)
	const isCloseMatch = (input: string, target: string): boolean => {
		if (Math.abs(input.length - target.length) > 2) return false;
		
		const shorter = input.length < target.length ? input : target;
		const longer = input.length >= target.length ? input : target;
		
		let differences = 0;
		let i = 0, j = 0;
		
		while (i < shorter.length && j < longer.length) {
			if (shorter[i] !== longer[j]) {
				differences++;
				if (differences > 2) return false;
				
				// Essayer de sauter un caractère dans la chaîne plus longue
				if (i + 1 < shorter.length && shorter[i + 1] === longer[j]) {
					i++;
				} else if (j + 1 < longer.length && shorter[i] === longer[j + 1]) {
					j++;
				} else {
					i++;
					j++;
				}
			} else {
				i++;
				j++;
			}
		}
		
		differences += Math.abs(longer.length - shorter.length);
		return differences <= 2;
	};	const handleUserInput = async (input: string) => {
		// Ajouter le message utilisateur
		addMessage('user', input);
		setIsLoading(true);

		// Debug: afficher les détections
		console.log('🔍 === DEBUT DEBUG ===');
		console.log('🔍 Input original:', `"${input}"`);
		console.log('🔍 Input normalisé:', `"${input.toLowerCase().trim()}"`);
		console.log('🔍 AuthStep actuel:', authStep);
		
		const normalizedInput = input.toLowerCase().trim();
		const isPositive = detectPositiveResponse(input);
		const isNegative = detectNegativeResponse(input);
		
		console.log('🔍 Résultat détection positive:', isPositive);
		console.log('🔍 Résultat détection négative:', isNegative);
		
		// Test manuel pour "non"
		if (normalizedInput === 'non') {
			console.log('🔍 TEST MANUEL: "non" détecté directement');
		}
		
		console.log('🔍 === FIN DEBUG ===');
				try {
			if (authStep === 'welcome') {
				// Test ultra-simple pour "non" en premier
				if (normalizedInput === 'non') {
					console.log('🎯 DETECTION DIRECTE: "non" trouvé - redirection immédiate');
					addMessage('assistant', 'Très bien ! Je vous redirige vers le chat principal. À bientôt ! 👋');
					setTimeout(() => {
						router.push('/chat');
					}, 2000);
					return;
				}
				
				// Puis les détections normales
				if (isNegative) {
					console.log('✅ NEGATIVE détecté - redirection vers chat');
					addMessage('assistant', 'Très bien ! Je vous redirige vers le chat principal. À bientôt ! 👋');
					setTimeout(() => {
						router.push('/chat');
					}, 2000);
					return; // Important: arrêter l'exécution ici
				} else if (isPositive) {
					console.log('✅ POSITIVE détecté - passage à email');
					addMessage('assistant', 'Parfait ! Quelle est votre adresse email ?');
					setAuthStep('email');
				} else {
					console.log('❓ NEITHER détecté - demande clarification');
					addMessage('assistant', 'Je n\'ai pas bien compris votre réponse. Souhaitez-vous vous connecter ? Répondez par "oui" pour vous connecter ou "non" pour continuer en mode invité.');
				}
			}else if (authStep === 'email') {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(input)) {
					addMessage('assistant', 'Hmm, cet email ne semble pas valide. Pouvez-vous le retaper ? (exemple: nom@exemple.com)');
					return;
				}

				setAuthData(prev => ({ ...prev, email: input }));

				const { data: existingUser } = await supabase
					.from('users_table')
					.select('email')
					.eq('email', input)
					.single();

				if (existingUser) {
					setAuthData(prev => ({ ...prev, isExistingUser: true }));
					addMessage('assistant', `Bonjour ! Je vous reconnais. Quel est votre mot de passe ?`);
					setAuthStep('password');
				} else {
					setAuthData(prev => ({ ...prev, isExistingUser: false }));
					addMessage('assistant', `Je ne vous connais pas encore ! Créons votre compte. Choisissez un mot de passe sécurisé (au moins 8 caractères avec lettres et chiffres).`);
					setAuthStep('signup');
				}
			} else if (authStep === 'password') {
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
				if (input.length < 8) {
					addMessage('assistant', 'Ce mot de passe est trop court. Il doit contenir au moins 8 caractères. Essayez encore !');
					return;
				}
				if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(input)) {
					addMessage('assistant', 'Votre mot de passe doit contenir à la fois des lettres et des chiffres pour plus de sécurité. Réessayez !');
					return;
				}

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
					}, 2000);
				}
			}
		} catch (error) {
			addMessage('assistant', 'Oups ! Il y a eu un petit problème technique. Pouvez-vous réessayer ?');
		} finally {
			setIsLoading(false);
		}
	};
	return (
		<Chat>
			<div className="container relative z-0 mx-auto space-y-4 px-4 pt-8 pb-30 sm:px-6">
				{authMessages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-4 pt-40 text-center">
						<Image
							src="/logo-neiji-full.png"
							alt="Neiji Logo"
							width={120}
							height={120}
						/>
						<p className="mx-auto max-w-md px-4 text-lg text-muted-foreground">
							Connexion à votre espace personnel Neiji
						</p>
					</div>
				) : (
					authMessages.map((message, index) => {
						if (message.role === "user") {
							return (
								<UserMessage key={message.id}>{message.content}</UserMessage>
							);
						}

						if (isLoading && index === authMessages.length - 1) {
							return null;
						}

						return <BotMessage key={message.id} message={message} />;
					})
				)}
			</div>
			
			{/* AuthInput remplace ChatInput */}
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
				onFocus={() => {
					if (authMessages.length === 1) {
						// Trigger welcome message if needed
					}
				}}
			/>
		</Chat>
	);
}

export default function AuthPage() {
	return (
		<GradientBackground>
			<AuthLogic />
		</GradientBackground>
	);
}
