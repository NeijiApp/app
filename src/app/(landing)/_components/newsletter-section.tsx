"use client";

import type React from "react";
import { useState } from "react";
import { api } from "~/trpc/react";
import PopupFeedBack from "../_components/PopupFeedBack";

export function NewsletterSection() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");

	const { mutate, error } = api.newsletter.create.useMutation();

	const [isPopupOpen, setIsPopupOpen] = useState(false);

	const handleOpenPopup = () => {
		setIsPopupOpen(true);
	};

	const handleClosePopup = () => {
		setIsPopupOpen(false);
	};


	return (
		<div>
			<section id="newsletter" className="bg-orange-50 py-20">
			<div className="container mx-auto px-6">
				<div className="mx-auto max-w-md text-center">
					<h2 className="mb-6 font-bold text-3xl">Stay Connected with Neiji</h2>
					<p className="mb-8 text-gray-600">
						Be the first to experience Neiji's App
					</p>

					<form
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							mutate({ email });
						}}
					>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-orange-500"
							required
						/>
						<button
							type="submit"
							onClick={handleOpenPopup}
							disabled={status === "loading"}
							className="w-full rounded-lg bg-orange-500 px-6 py-3 text-white transition hover:bg-orange-600 disabled:opacity-50"
						>
							{status === "loading" ? "Subscribing..." : "Subscribe"}
						</button>
						<PopupFeedBack
							isOpen={isPopupOpen}
							onClose={handleClosePopup}
						/>
					</form>

					{status === "success" && (
						<p className="mt-4 text-green-600">Thank you for subscribing!</p>
					)}
					{status === "error" && (
						<p className="mt-4 text-red-600">
							Something went wrong. Please try again.
						</p>
					)}
				</div>
			</div>
		</section>
		</div>
	);
}
