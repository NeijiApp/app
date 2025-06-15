/**
 * @fileoverview Page de questionnaire interactif pour le profil de personnalité
 * 
 * Cette page présente un questionnaire interactif avec l'interface chat pour
 * collecter les informations de personnalité de l'utilisateur. Elle utilise
 * des questions prédéfinies et sauvegarde les réponses de manière structurée.
 * 
 * @component QuestionnaireInteractivePage
 * @description Questionnaire interactif avec interface de chat pour profiler l'utilisateur
 * 
 * Fonctionnalités principales :
 * - Interface de chat interactive pour les questions
 * - Questions prédéfinies stockées en JSON
 * - Sauvegarde progressive des réponses
 * - Animation de frappe pour les questions
 * - Progression séquentielle à travers les questions
 * - Redirection vers chat une fois terminé
 * - Interface responsive et moderne
 * 
 * @author Neiji Team
 * @version 1.0.0
 * @since 2025
 */

"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "~/utils/supabase/client";
import { useRouter } from "next/navigation";

// Interface pour les messages du questionnaire
interface QuestionnaireMessage {
	id: number;
	sender: "user" | "bot";
	text: string;
	avatar?: string;
	senderName?: string;
	isTyping?: boolean;
	questionId?: number;
}

// Interface pour une question
interface Question {
	id: number;
	question: string;
	context: string;
	key: string; // Clé pour stocker la réponse
}

export default function QuestionnaireInteractivePage() {
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<QuestionnaireMessage[]>([]);
	const messagesEndRef = useRef<null | HTMLDivElement>(null);
	const [questionnaireStarted, setQuestionnaireStarted] = useState(false);
	const [displayedText, setDisplayedText] = useState<{ [key: number]: string }>({});
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<{ [key: string]: string }>({});
	const [isLoading, setIsLoading] = useState(true);	const [isSaving, setIsSaving] = useState(false);
	const [isCompleted, setIsCompleted] = useState(false);
	const [isBotTyping, setIsBotTyping] = useState(false);

	const botAvatar = "/logo-neiji-full.png";
	const ppBot = "/NeijiHeadLogo1.4.png";
	const router = useRouter();
	const supabase = createClient();	// Questions du questionnaire - réorganisées avec tutoiement et plus d'intimité
	const questions: Question[] = [
		{
			id: 1,
			question: "Quel âge as-tu ?",
			context: "Ton âge m'aide à mieux adapter mes conseils",
			key: "age"
		},
		{
			id: 2,
			question: "Dans quel domaine tu travailles ou tu étudies ?",
			context: "Ton domaine professionnel ou d'études",
			key: "metier"
		},
		{
			id: 3,
			question: "Quel est ton objectif principal en ce moment ?",
			context: "Ce que tu cherches à accomplir actuellement",
			key: "objectif"
		},
		{
			id: 4,
			question: "Tu préfères travailler seul(e) ou en équipe ?",
			context: "Ta préférence de travail et de collaboration",
			key: "travail_preference"
		},
		{
			id: 5,
			question: "Tu es plutôt du matin ou du soir ?",
			context: "Tes habitudes et ton rythme de vie",
			key: "rythme"
		},
		{
			id: 6,
			question: "Comment tu décrirais ta personnalité en quelques mots ?",
			context: "Tes traits de caractère principaux",
			key: "personnalite"
		},
		{
			id: 7,
			question: "Tu te considères plutôt introverti(e) ou extraverti(e) ?",
			context: "Ta relation aux autres et à la socialisation",
			key: "intro_extro"
		},
		{
			id: 8,
			question: "Quel style de communication tu préfères ?",
			context: "Direct, diplomatique, détaillé, concis...",
			key: "communication"
		},
		{
			id: 9,
			question: "Qu'est-ce qui te motive le plus dans la vie ?",
			context: "Tes valeurs et ce qui te pousse à agir",
			key: "motivation"
		},
		{
			id: 10,
			question: "Comment tu gères le stress ?",
			context: "Tes mécanismes pour faire face aux situations difficiles",
			key: "gestion_stress"
		},
		{
			id: 11,
			question: "Comment tu prends tes décisions importantes ?",
			context: "Ton processus de prise de décision",
			key: "prise_decision"
		},
		{
			id: 12,
			question: "Y a-t-il autre chose d'important que je devrais savoir sur toi ?",
			context: "Tout détail que tu juges pertinent pour mieux te comprendre",
			key: "autre"
		}
	];

	// Défilement auto
	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		if (questionnaireStarted) {
			scrollToBottom();
		}
	}, [scrollToBottom, questionnaireStarted, messages]);	// Fonction pour simuler l'effet de frappe (encore plus rapide)
	const typeMessage = (messageId: number, fullText: string) => {
		let currentText = "";
		setDisplayedText((prev) => ({ ...prev, [messageId]: "" }));
		setIsBotTyping(true); // Le bot commence à écrire

		const interval = setInterval(() => {
			if (currentText.length < fullText.length) {
				currentText = fullText.substring(0, currentText.length + 1);
				setDisplayedText((prev) => ({ ...prev, [messageId]: currentText }));
			} else {
				clearInterval(interval);
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === messageId
							? { ...msg, isTyping: false, text: fullText }
							: msg,
					),
				);
				setIsBotTyping(false); // Le bot a fini d'écrire
			}
		}, 15); // Réduit de 20ms à 15ms pour une écriture encore plus rapide
	};	// Chargement des données existantes et démarrage automatique
	useEffect(() => {
		const loadExistingData = async () => {
			try {
				const { data: { user }, error: userError } = await supabase.auth.getUser();
				
				if (userError || !user) {
					router.push("/auth/login");
					return;
				}

				// Récupération des données du questionnaire
				const { data, error } = await supabase
					.from("users_table")
					.select("questionnaire")
					.eq("email", user.email)
					.single();				if (error && error.code !== 'PGRST116') {
					console.error("Erreur lors du chargement:", error);
				} else if (data?.questionnaire) {
					// Plus besoin de JSON.parse car questionnaire est déjà un objet JSON
					const existingAnswers = data.questionnaire;
					if (existingAnswers && typeof existingAnswers === 'object') {
						setAnswers(existingAnswers);
						// Si toutes les questions ont des réponses, rediriger vers profile
						if (Object.keys(existingAnswers).length === questions.length) {
							router.push("/protected/profile");
							return;
						}
					}
				}

				// Démarrage automatique du questionnaire si pas encore commencé
				if (!questionnaireStarted && !isCompleted) {
					setTimeout(() => {
						handleStartQuestionnaire();
					}, 1000); // Délai de 1 seconde après le chargement
				}
			} catch (err) {
				console.error("Erreur:", err);
			} finally {
				setIsLoading(false);
			}
		};

		loadExistingData();
	}, [router, supabase, questions.length, questionnaireStarted, isCompleted]);

	// Fonction pour démarrer le questionnaire
	const handleStartQuestionnaire = () => {
		if (questionnaireStarted) return;

		setQuestionnaireStarted(true);
		setTimeout(() => {
			// Augmenter l'index car on pose déjà la première question dans le message de bienvenue
			setCurrentQuestionIndex(1);
			const welcomeMessage: QuestionnaireMessage = {
				id: Date.now(),
				sender: "bot",
				text: "Salut ! Je vais te poser quelques questions pour mieux te connaître. Tes réponses m'aideront à personnaliser notre interaction. Quel âge as-tu ?",
				avatar: ppBot,
				senderName: "Neiji",
				isTyping: true,
			};
			setMessages([welcomeMessage]);
			typeMessage(welcomeMessage.id, welcomeMessage.text);
		}, 300);
	};

	// Fonction pour poser la question suivante
	const askNextQuestion = () => {
		if (currentQuestionIndex >= questions.length) {
			// Toutes les questions ont été posées
			handleQuestionnaireComplete();
			return;
		}

		const currentQuestion = questions[currentQuestionIndex];
		if (!currentQuestion) return;

		setTimeout(() => {
			const questionMessage: QuestionnaireMessage = {
				id: Date.now(),
				sender: "bot",
				text: currentQuestion.question,
				avatar: ppBot,
				senderName: "Neiji",
				isTyping: true,
				questionId: currentQuestion.id,
			};
			setMessages((prev) => [...prev, questionMessage]);
			typeMessage(questionMessage.id, questionMessage.text);
		}, 1000);
	};	// Fonction appelée quand le questionnaire est terminé
	const handleQuestionnaireComplete = () => {
		setIsCompleted(true);
		setTimeout(() => {
			const completionMessage: QuestionnaireMessage = {
				id: Date.now(),
				sender: "bot",
				text: "Parfait ! J'ai maintenant une bien meilleure compréhension de ta personnalité. Ces informations m'aideront à adapter mes réponses et conseils selon ton profil unique.",
				avatar: ppBot,
				senderName: "Neiji",
				isTyping: true,
			};
			setMessages((prev) => [...prev, completionMessage]);
			typeMessage(completionMessage.id, completionMessage.text);
					// Message de redirection après 3 secondes
			setTimeout(() => {
				const redirectMessage: QuestionnaireMessage = {
					id: Date.now() + 1,
					sender: "bot",
					text: "Tu vas être redirigé vers ton profil dans 10 secondes pour voir tes réponses ! 🚀",
					avatar: ppBot,
					senderName: "Neiji",
					isTyping: true,
				};
				setMessages((prev) => [...prev, redirectMessage]);
				typeMessage(redirectMessage.id, redirectMessage.text);
				
				// Redirection vers le profil après 10 secondes supplémentaires
				setTimeout(() => {
					router.push("/protected/profile");
				}, 10000);
			}, 3000);
		}, 1000);
	};	// Sauvegarde des réponses avec gestion d'erreurs améliorée
	const saveAnswers = async (newAnswers: { [key: string]: string }) => {
		try {
			setIsSaving(true);
			
			// DEBUG: Log de démarrage
			console.log("🔧 DEBUG QUESTIONNAIRE - Début de sauvegarde");
			console.log("🔧 DEBUG - Données à sauvegarder:", newAnswers);
			console.log("🔧 DEBUG - Type des données:", typeof newAnswers);
			console.log("🔧 DEBUG - Nombre de réponses:", Object.keys(newAnswers).length);
			console.log("🔧 DEBUG - Clés des réponses:", Object.keys(newAnswers));
			
			const { data: { user }, error: userError } = await supabase.auth.getUser();
			
			if (userError || !user) {
				console.error("🔧 DEBUG - Erreur d'authentification:", userError);
				router.push("/auth/login");
				return;
			}

			console.log("🔧 DEBUG - Utilisateur authentifié:", user.email);

			// D'abord, vérifier si l'utilisateur existe
			const { data: existingUser, error: checkError } = await supabase
				.from("users_table")
				.select("email, questionnaire")
				.eq("email", user.email)
				.single();

			console.log("🔧 DEBUG - Utilisateur existant trouvé:", existingUser);
			console.log("🔧 DEBUG - Questionnaire existant:", existingUser?.questionnaire);
			console.log("🔧 DEBUG - Erreur de vérification:", checkError);

			// Utiliser update au lieu d'upsert pour plus de fiabilité
			const { data, error } = await supabase
				.from("users_table")
				.update({
					questionnaire: newAnswers // Objet JSON direct
				})
				.eq("email", user.email)
				.select();

			console.log("🔧 DEBUG - Résultat de la sauvegarde:", data);
			console.log("🔧 DEBUG - Erreur de sauvegarde:", error);

			if (error) {
				console.error("🔧 DEBUG - Erreur lors de la sauvegarde:", error);
			} else {
				console.log("🔧 DEBUG - Sauvegarde réussie!");
			}

			// Vérification après sauvegarde
			const { data: verification, error: verifyError } = await supabase
				.from("users_table")
				.select("questionnaire")
				.eq("email", user.email)
				.single();

			console.log("🔧 DEBUG - Vérification post-sauvegarde:", verification);
			console.log("🔧 DEBUG - Questionnaire sauvegardé:", verification?.questionnaire);
			console.log("🔧 DEBUG - Type du questionnaire sauvegardé:", typeof verification?.questionnaire);
			console.log("🔧 DEBUG - Erreur de vérification:", verifyError);

		} catch (err) {
			console.error("🔧 DEBUG - Erreur lors de la sauvegarde:", err);
		} finally {
			setIsSaving(false);
			console.log("🔧 DEBUG - Fin de sauvegarde");
		}
	};
	// Gestion de l'envoi de message
	const handleSendMessage = async () => {
		if (!message.trim() || isCompleted || isBotTyping) return;

		const userMessage: QuestionnaireMessage = {
			id: Date.now(),
			sender: "user",
			text: message.trim(),
		};

		setMessages((prev) => [...prev, userMessage]);

		if (!questionnaireStarted) {
			// Premier message = démarrage du questionnaire
			setQuestionnaireStarted(true);
			setMessage("");
			askNextQuestion();		} else {
			// Sauvegarde de la réponse à la question actuelle avec la clé descriptive
			const currentQuestion = questions[currentQuestionIndex-1];
			if (currentQuestion) {
				const newAnswers = {
					...answers,
					[currentQuestion.key]: message.trim() // Utiliser la clé descriptive
				};
				setAnswers(newAnswers);
				await saveAnswers(newAnswers);
			}

			setMessage("");
			const nextQuestionIndex = currentQuestionIndex + 1;
			setCurrentQuestionIndex(nextQuestionIndex);			// Passer à la question suivante ou terminer
			setTimeout(() => {
				if (nextQuestionIndex >= questions.length) {
					handleQuestionnaireComplete();
				} else {
					askNextQuestion();
				}
			}, 500);
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleSendMessage();
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-orange-100 to-orange-200">
				<div className="text-lg">Chargement de votre questionnaire...</div>
			</div>
		);
	}	return (
		<div className="relative flex min-h-screen flex-col bg-gradient-to-br from-white via-orange-100 to-orange-200 p-4">
			{/* --- Contenu Principal (Conditionnel) --- */}
			<div className="flex w-full flex-grow flex-col items-center overflow-hidden">
				{!questionnaireStarted ? (
					/* --- Vue Accueil (avant le premier message) --- */
					<div className="mt-10 flex w-full flex-grow flex-col items-center justify-center px-4 transition-opacity duration-300 ease-in-out">
						{/* Image mascotte */}
						<div className="mt-0 h-40 w-40 md:mb-0 ">
							<img
								src={botAvatar}
								alt="Neiji Mascotte"
								className="h-full w-full object-contain"
								style={{ clipPath: "inset(0 0 18px 0)" }}
							/>
						</div>
						{/* Texte de présentation */}
						<div className="mb-20 max-w-sm text-center">							<div className="mb-20 max-w-sm text-center">
								<p className="font-medium text-gray-800 text-lg">
									Salut ! Je suis Neiji, ton coach personnel.
									<br />
									Faisons connaissance pour que je puisse t'aider au mieux !
								</p>
								{isCompleted && (
									<p className="mt-4 font-medium text-orange-600 text-sm">
										Tu as déjà complété le questionnaire. Tu peux aller au chat !
									</p>
								)}
							</div>
						</div>
					</div>
				) : (
					/* --- Vue Chat (après le premier message) --- */
					<div
						className={`mb-40 w-full max-w-2xl flex-grow animate-fade-in space-y-4 overflow-y-auto overflow-x-hidden px-2 py-4 pt-26 sm:pt-26`}
					>
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"} fade-in`}
								style={{ animationDelay: `${msg.id % 1000}ms` }}
							>
								{/* Avatar et Nom pour le bot */}
								{msg.sender === "bot" && msg.avatar && (
									<img
										src={msg.avatar}
										alt={msg.senderName || "Bot"}
										className="-left-0 -translate-y-1/2 absolute top-2 h-12 w-12"
									/>
								)}
								<div
									className={`flex flex-col ${msg.sender === "user" ? "relative items-end" : "items-start"}`}
								>
									{/* Nom de l'expéditeur pour le bot */}
									{msg.sender === "bot" && msg.senderName && (
										<span
											className="relative mb-0 font-semibold text-gray-800 text-xs"
											style={{ left: "44px" }}
										>
											{msg.senderName}
										</span>
									)}
									{/* Bulle de message */}
									<div
										className={`max-w-xs px-4 py-2 shadow lg:max-w-md ${
											msg.sender === "user"
												? "rounded-tl-xl rounded-tr-xl rounded-br-none rounded-bl-xl bg-white text-gray-800"
												: "rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none bg-orange-500 text-white"
										}`}
									>
										{msg.sender === "bot" && msg.isTyping ? (
											<span className="typing-text">
												{displayedText[msg.id] || "..."}
											</span>
										) : (
											msg.text
										)}
									</div>
									{/* Icône utilisateur */}
									{msg.sender === "user" && (
										<div className="-right-10 absolute top-0 rounded-full bg-orange-500 p-1.5">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5 text-white"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
													clipRule="evenodd"
												/>
											</svg>
										</div>
									)}
								</div>
							</div>
						))}
						{/* Élément pour le scroll */}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* --- Champ de message --- */}
			<div className="message-container sticky bottom-0 w-full max-w-xl self-center p-4 transition-all duration-500 ease-in-out">
				<div className="relative flex items-center gap-2">
					<input
						type="text"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onClick={!questionnaireStarted ? handleStartQuestionnaire : undefined}
						onKeyPress={handleKeyPress}						placeholder={
							isCompleted 
								? "Questionnaire terminé - Voir ton profil !"
								: isBotTyping
									? "Attends que Neiji finisse d'écrire..."
									: questionnaireStarted 
										? "Ta réponse..." 
										: "Commencer le questionnaire"
						}className={`message-input flex-1 cursor-pointer rounded-full px-6 py-3 text-lg shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 ${
							isCompleted || isBotTyping
								? "cursor-not-allowed bg-gray-100 text-gray-400 focus:ring-gray-300"
								: "bg-white focus:ring-orange-500"
						}`}
						disabled={isCompleted || isBotTyping}
					/>					<button
						type="button"
						onClick={questionnaireStarted && !isCompleted && !isBotTyping ? handleSendMessage : (!questionnaireStarted ? handleStartQuestionnaire : undefined)}
						className={`send-button -translate-y-1/2 absolute top-1/2 right-2 transform rounded-full p-2 text-white transition-all ${
							isCompleted || isBotTyping
								? "cursor-not-allowed bg-gray-400"
								: "bg-orange-500 hover:bg-orange-600 hover:shadow-lg"
						}`}
						disabled={isCompleted || isBotTyping}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6 translate-x-[1px] rotate-90 transform"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
							/>
						</svg>
					</button>
				</div>
				
				{/* Indicateur de progression */}
				{questionnaireStarted && !isCompleted && (
					<div className="mt-3 text-center">
						<p className="text-orange-700 text-sm">
							Question {currentQuestionIndex } sur {questions.length}
						</p>
						<div className="mx-auto mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-orange-200">
							<div 
								className="h-full bg-orange-500 transition-all duration-300 ease-out"
								style={{ width: `${((currentQuestionIndex ) / questions.length) * 100}%` }}
							/>
						</div>
					</div>
				)}				{/* Bouton pour aller au profil si terminé */}
				{isCompleted && (
					<div className="mt-3 text-center">
						<button
							onClick={() => router.push("/protected/profile")}
							className="rounded-full bg-orange-500 px-6 py-2 text-white transition-all hover:bg-orange-600"
						>
							Voir mon Profil
						</button>
					</div>
				)}				{/* Indicateur de sauvegarde */}
				{isSaving && (
					<div className="mt-2 text-center text-orange-600 text-sm">
						Sauvegarde en cours...
					</div>
				)}
			</div>

			{/* CSS pour les animations */}
			<style jsx global>{`
				@keyframes fadeIn {
					from { opacity: 0; transform: translateY(10px); }
					to { opacity: 1; transform: translateY(0); }
				}
				
				@keyframes fadeInUp {
					from { opacity: 0; transform: translateY(20px); }
					to { opacity: 1; transform: translateY(0); }
				}
				
				@keyframes popIn {
					0% { transform: scale(0.8); opacity: 0; }
					70% { transform: scale(1.05); opacity: 1; }
					100% { transform: scale(1); opacity: 1; }
				}
				
				.message-container {
					background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,237,213,0.9) 100%);
					backdrop-filter: blur(8px);
					transform-origin: bottom center;
					box-shadow: 0 -5px 20px rgba(251, 146, 60, 0.1);
					border-radius: 20px 20px 0 0;
					animation: popIn 0.5s ease-out;
				}
				
				.send-button {
					animation: popIn 0.4s ease-out 0.1s both;
					box-shadow: 0 2px 8px rgba(251, 146, 60, 0.3);
				}
				
				.message-input {
					animation: fadeIn 0.4s ease-out;
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
					transition: all 0.3s ease;
				}
				
				.message-input:focus {
					box-shadow: 0 4px 12px rgba(251, 146, 60, 0.25);
					transform: translateY(-1px);
				}
				
				.animate-fade-in {
					animation: fadeIn 0.3s ease-in-out;
				}
				
				.fade-in {
					animation: fadeIn 0.3s ease-in-out forwards;
					opacity: 0;
				}
						.typing-text {
					color: inherit !important; /* Force la couleur héritée */
					position: relative;
				}
				
				.typing-text::after {
					content: '|';
					animation: cursor-blink 1s infinite;
					color: currentColor;
				}
				
				@keyframes cursor-blink {
					0%, 50% { opacity: 1; }
					51%, 100% { opacity: 0; }
				}
			`}</style>
		</div>
	);
}
