"use client";

import { useState } from "react";

interface AuthInputProps {
	onSend: (input: string) => void;
	disabled: boolean;
	placeholder: string;
	isPassword?: boolean;
	onFocus?: () => void;
}

export function AuthInput({ 
	onSend, 
	disabled, 
	placeholder, 
	isPassword = false, 
	onFocus 
}: AuthInputProps) {
	const [input, setInput] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (input.trim() && !disabled) {
			onSend(input.trim());
			setInput("");
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleSubmit(event);
		}
	};
	return (
		<>
			{/* --- Champ de message --- */}
			<div className="message-container fixed right-1/2 bottom-0 z-10 w-full max-w-xl translate-x-1/2 self-center p-4 transition-all duration-500 ease-in-out">
				<div className="relative flex items-center gap-2">
					<input
						type={isPassword ? "password" : "text"}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyPress={handleKeyPress}
						onFocus={onFocus}
						placeholder={placeholder}
						disabled={disabled}
						className="message-input flex-1 cursor-pointer rounded-full bg-white px-6 py-3 text-lg shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
					/>
					<button
						type="button"
						onClick={() => handleSubmit(new Event('submit') as any)}
						disabled={disabled || !input.trim()}
						className="send-button -translate-y-1/2 absolute top-1/2 right-2 transform rounded-full bg-orange-500 p-2 text-white transition-all hover:bg-orange-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
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
			</div>

			{/* Enhanced CSS for animations - identique à la page ask */}
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
				
				@keyframes gradientShift {
					0% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
					100% { background-position: 0% 50%; }
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
				
				.animate-fade-in-up {
					animation: fadeInUp 0.5s ease-out;
				}
				
				.animate-fade-in {
					animation: fadeIn 0.3s ease-in-out;
				}
				
				.fade-in {
					animation: fadeIn 0.3s ease-in-out forwards;
					opacity: 0;
				}
			`}</style>
		</>
	);
}
