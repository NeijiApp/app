"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "~/utils/supabase/client";

export default function ConfirmPage() {
	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
	const [message, setMessage] = useState("");
	const router = useRouter();

	useEffect(() => {
		const confirmEmail = async () => {
			const supabase = createClient();
			
			try {
				// Récupérer les paramètres de l'URL
				const urlParams = new URLSearchParams(window.location.search);
				const token = urlParams.get("token");
				const type = urlParams.get("type");
				
				if (!token || !type) {
					setStatus("error");
					setMessage("Lien de confirmation invalide.");
					return;
				}

				// Confirmer l'email avec Supabase
				const { data, error } = await supabase.auth.verifyOtp({
					token_hash: token,
					type: type as any,
				});

				if (error) {
					console.error("Erreur de confirmation:", error);
					setStatus("error");
					setMessage("Erreur lors de la confirmation de votre email.");
					return;
				}

				setStatus("success");
				setMessage("Votre email a été confirmé avec succès !");
				
				// Rediriger vers le chat protégé après 3 secondes
				setTimeout(() => {
					router.push("/protected/chat");
				}, 3000);

			} catch (error) {
				console.error("Erreur:", error);
				setStatus("error");
				setMessage("Une erreur est survenue.");
			}
		};

		confirmEmail();
	}, [router]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 px-4">
			<div className="w-full max-w-md">
				{/* Logo Neiji */}
				<div className="mb-8 text-center">
					<Image
						src="/logo-neiji-full.png"
						alt="Neiji Logo"
						width={120}
						height={120}
						className="mx-auto"
					/>
				</div>
				
				{/* Card principale */}
				<div className="rounded-lg bg-white p-8 shadow-lg">
					{status === "loading" && (
						<div className="text-center">
							<div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
							<h1 className="text-xl font-semibold text-gray-800">
								Confirmation en cours...
							</h1>
							<p className="mt-2 text-gray-600">
								Veuillez patienter pendant que nous confirmons votre email.
							</p>
						</div>
					)}

					{status === "success" && (
						<div className="text-center">
							<div className="mb-4 h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
								<svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<h1 className="text-xl font-semibold text-green-800">
								Email confirmé !
							</h1>
							<p className="mt-2 text-gray-600">
								{message}
							</p>
							<p className="mt-4 text-sm text-gray-500">
								Redirection vers votre chat en cours...
							</p>
						</div>
					)}

					{status === "error" && (
						<div className="text-center">
							<div className="mb-4 h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
								<svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</div>
							<h1 className="text-xl font-semibold text-red-800">
								Erreur de confirmation
							</h1>
							<p className="mt-2 text-gray-600">
								{message}
							</p>
							<button
								onClick={() => router.push("/auth/signup")}
								className="mt-4 rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 transition-colors"
							>
								Retour à l'inscription
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
