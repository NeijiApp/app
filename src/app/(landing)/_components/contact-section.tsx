"use client";

import {
	Instagram,
	Linkedin,
	Mail,
	MessagesSquare,
	Twitter,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

export function ContactSection() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		message: "",
	});
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");

	const socialLinks = [
		{
			name: "Instagram",
			icon: Instagram,
			href: "https://instagram.com/neiji.app",
			color: "hover:text-pink-500",
		},
		{
			name: "X (Twitter)",
			icon: Twitter,
			href: "https://twitter.com/neiji_app",
			color: "hover:text-black",
		},
		{
			name: "LinkedIn",
			icon: Linkedin,
			href: "https://www.linkedin.com/company/neiji",
			color: "hover:text-blue-600",
		},
		{
			name: "Reddit",
			icon: MessagesSquare,
			href: "https://www.reddit.com/r/neiji/",
			color: "hover:text-orange-600",
		},
		{
			name: "Email",
			icon: Mail,
			href: "mailto:emeric.yeou@neiji-app.com",
			color: "hover:text-blue-500",
		},
	];

	return (
		<div className="min-h-screen bg-gray-50">
			<section className="pt-28 pb-20">
				{" "}
				{/* Increased top padding to prevent header overlap */}
				<div className="container mx-auto px-6">
					<div className="mx-auto max-w-4xl">
						<h2 className="mb-8 text-center font-bold text-4xl text-gray-900">
							Connect With Neiji
						</h2>

						{/* Social Media Links */}
						<div className="mb-12 rounded-2xl bg-white p-8 shadow-sm">
							<h3 className="mb-8 text-center font-bold text-2xl text-gray-900">
								Follow Us
							</h3>
							<div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
								{socialLinks.map((social) => (
									<a
										key={social.name}
										href={social.href}
										target="_blank"
										rel="noopener noreferrer"
										className="group flex flex-col items-center gap-3"
									>
										<div
											className={`rounded-full bg-gray-50 p-4 transition-all duration-300 group-hover:shadow-lg ${social.color}`}
										>
											<social.icon className="h-8 w-8" />
										</div>
										<span className="text-center font-medium text-gray-600 text-sm group-hover:text-gray-900">
											{social.name}
										</span>
									</a>
								))}
							</div>
						</div>

						{/* Contact Form */}
						<div className="rounded-2xl bg-white p-8 shadow-sm">
							<h3 className="mb-8 text-center font-bold text-2xl text-gray-900">
								Send Us a Message
							</h3>
							<form className="mx-auto max-w-2xl space-y-6">
								<div>
									<label
										htmlFor="name"
										className="mb-1 block font-medium text-gray-700 text-sm"
									>
										Name
									</label>
									<input
										type="text"
										id="name"
										name="name"
										value={formData.name}
										required
										className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-orange-500"
										placeholder="Your full name"
									/>
								</div>

								<div>
									<label
										htmlFor="email"
										className="mb-1 block font-medium text-gray-700 text-sm"
									>
										Email
									</label>
									<input
										type="email"
										id="email"
										name="email"
										value={formData.email}
										required
										className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-orange-500"
										placeholder="your.email@example.com"
									/>
								</div>

								<div>
									<label
										htmlFor="message"
										className="mb-1 block font-medium text-gray-700 text-sm"
									>
										Message
									</label>
									<textarea
										id="message"
										name="message"
										value={formData.message}
										required
										rows={6}
										className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-orange-500"
										placeholder="Type your message here..."
									/>
								</div>

								<button
									type="submit"
									disabled={status === "loading"}
									className="w-full rounded-lg bg-orange-500 px-6 py-3 text-white transition duration-300 hover:bg-orange-600 disabled:opacity-50"
								>
									{status === "loading" ? "Sending..." : "Send Message"}
								</button>

								{status === "success" && (
									<div className="rounded-lg bg-green-50 p-4 text-center text-green-600">
										Thank you for your message! We'll get back to you soon.
									</div>
								)}
								{status === "error" && (
									<div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
										We couldn't send your message. Please try again or email us
										directly.
									</div>
								)}
							</form>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
