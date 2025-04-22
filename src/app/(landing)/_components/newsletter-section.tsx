"use client";

import type React from "react";
import { useState } from "react";

export function NewsletterSection() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");

	return (
		<section id="newsletter" className="py-20 bg-orange-50">
			<div className="container mx-auto px-6">
				<div className="max-w-md mx-auto text-center">
					<h2 className="text-3xl font-bold mb-6">Stay Connected with Neiji</h2>
					<p className="text-gray-600 mb-8">
						Be the first to experience Neiji's App
					</p>

					<form className="space-y-4">
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
							required
						/>
						<button
							type="submit"
							disabled={status === "loading"}
							className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
						>
							{status === "loading" ? "Subscribing..." : "Subscribe"}
						</button>
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
	);
}
