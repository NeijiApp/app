"use client";

import axios from "axios";
import { Send, Star } from "lucide-react";
import { useEffect, useState } from "react";

export default function Feedback() {
	const [rating, setRating] = useState<number>(0);
	const [feedback, setFeedback] = useState<string>("");
	const [submitted, setSubmitted] = useState<boolean>(false);
	const [feedbacks, setFeedbacks] = useState<
		{ id: number; rating: number; feedback: string }[]
	>([]);

	const fetchFeedbacks = async () => {
		try {
			const response = await axios.get("https://api.neiji-app.com/feedback");
			setFeedbacks(response.data); // On suppose que le backend retourne une liste
		} catch (error) {
			console.error("Erreur lors de la récupération des feedbacks :", error);
			alert("Impossible de récupérer les feedbacks.");
		}
	};

	const handleSubmit = async () => {
		if (!rating || feedback.length > 300) {
			alert(
				"Veuillez donner une note et un commentaire de moins de 300 caractères.",
			);
			return;
		}

		try {
			await axios.post("https://api.neiji-app.com/feedback", {
				rating,
				feedback,
			});
			setSubmitted(true);
			setRating(0);
			setFeedback("");
			fetchFeedbacks(); // Recharge les feedbacks après envoi
		} catch (error) {
			console.error(error);
			alert("Une erreur s'est produite lors de l'envoi du feedback.");
		}
	};

	useEffect(() => {
		if (submitted) {
			alert("Merci pour votre feedback !");
			setSubmitted(false);
		}
	}, [submitted]);

	return (
		<main className="mx-auto max-w-3xl px-6 py-12 pt-20">
			<div className="mb-12 text-center">
				<h1 className="mb-4 font-bold text-4xl text-[#1A1E2C]">
					Comment était votre expérience ?
				</h1>
				<p className="text-gray-600">
					Votre feedback nous aide à améliorer l'expérience méditative avec
					notre IA.
				</p>
			</div>
			<div className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
				<div className="mb-8 flex justify-center gap-4">
					{[1, 2, 3, 4, 5].map((star) => (
						<button
							type="button"
							key={star}
							onClick={() => setRating(star)}
							className={`transition-all ${
								star <= rating ? "text-[#FF6B2C]" : "text-gray-300"
							} hover:scale-110`}
						>
							<Star size={40} fill={star <= rating ? "#FF6B2C" : "none"} />
						</button>
					))}
				</div>
				<div className="mb-6">
					<textarea
						value={feedback}
						onChange={(e) => setFeedback(e.target.value)}
						placeholder="Partagez votre expérience avec nous..."
						className="h-32 w-full resize-none rounded-xl border border-gray-200 p-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]"
					/>
				</div>
				<button
					type="button"
					onClick={handleSubmit}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B2C] py-4 font-semibold text-white transition-colors hover:bg-[#e55b20]"
				>
					<Send size={20} />
					Envoyer mon feedback
				</button>
			</div>

			{/* Liste des feedbacks */}
			<div className="rounded-2xl bg-white p-8 shadow-sm">
				<h2 className="mb-4 font-bold text-2xl text-[#1A1E2C]">
					Vos Feedbacks
				</h2>
				{feedbacks.length > 0 ? (
					<ul className="space-y-4">
						{feedbacks.map(({ id, rating, feedback }) => (
							<li
								key={id}
								className="rounded-lg border border-gray-200 p-4 shadow-sm"
							>
								<p className="font-bold text-[#FF6B2C]">Note : {rating} / 5</p>
								<p>{feedback}</p>
							</li>
						))}
					</ul>
				) : (
					<p className="text-gray-600">Aucun feedback pour le moment.</p>
				)}
			</div>
		</main>
	);
}
