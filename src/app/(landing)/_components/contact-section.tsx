"use client";

import type React from "react";
import { useState } from "react";
import {
	Instagram,
	Twitter,
	Mail,
	MessagesSquare,
	Linkedin,
} from "lucide-react";

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
					<div className="max-w-4xl mx-auto">
						<h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
							Connect With Neiji
						</h2>

						{/* Social Media Links */}
						<div className="bg-white rounded-2xl p-8 shadow-sm mb-12">
							<h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
								Follow Us
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
								{socialLinks.map((social) => (
									<a
										key={social.name}
										href={social.href}
										target="_blank"
										rel="noopener noreferrer"
										className="flex flex-col items-center gap-3 group"
									>
										<div
											className={`p-4 rounded-full bg-gray-50 transition-all duration-300 group-hover:shadow-lg ${social.color}`}
										>
											<social.icon className="w-8 h-8" />
										</div>
										<span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 text-center">
											{social.name}
										</span>
									</a>
								))}
							</div>
						</div>

						{/* Contact Form */}
						<div className="bg-white rounded-2xl p-8 shadow-sm">
							<h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
								Send Us a Message
							</h3>
							<form className="max-w-2xl mx-auto space-y-6">
								<div>
									<label
										htmlFor="name"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Name
									</label>
									<input
										type="text"
										id="name"
										name="name"
										value={formData.name}
										required
										className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
										placeholder="Your full name"
									/>
								</div>

								<div>
									<label
										htmlFor="email"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Email
									</label>
									<input
										type="email"
										id="email"
										name="email"
										value={formData.email}
										required
										className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
										placeholder="your.email@example.com"
									/>
								</div>

								<div>
									<label
										htmlFor="message"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Message
									</label>
									<textarea
										id="message"
										name="message"
										value={formData.message}
										required
										rows={6}
										className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
										placeholder="Type your message here..."
									/>
								</div>

								<button
									type="submit"
									disabled={status === "loading"}
									className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition duration-300 disabled:opacity-50"
								>
									{status === "loading" ? "Sending..." : "Send Message"}
								</button>

								{status === "success" && (
									<div className="p-4 bg-green-50 text-green-600 rounded-lg text-center">
										Thank you for your message! We'll get back to you soon.
									</div>
								)}
								{status === "error" && (
									<div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
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
