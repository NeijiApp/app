"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, SendHorizonal, Eye, EyeOff } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

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
}: AuthInputProps) {	const [input, setInput] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	
	// Réinitialiser la visibilité du mot de passe quand isPassword change
	useEffect(() => {
		setShowPassword(false);
	}, [isPassword]);
	
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (input.trim() && !disabled) {
			onSend(input.trim());
			setInput("");
		}
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<>
			{/* Zone de saisie avec structure identique au ChatInput */}
			<div className="fixed right-1/2 bottom-0 z-10 w-full max-w-xl translate-x-1/2 self-center transition-all duration-500 ease-in-out">
				<div className="bg-gradient-to-r from-white/90 to-orange-100/90 p-4 backdrop-blur-md rounded-t-2xl">
					<div className="flex items-center gap-3">
						{/* Bouton de retour (même style que le bouton User du chat) */}
						<Link href="/chat">
							<Button
								type="button"
								size="icon"
								className="size-11 flex-shrink-0 rounded-full p-2 text-white bg-orange-500 hover:bg-orange-600 transition-all"
							>
								<ArrowLeft className="size-6" />
							</Button>
						</Link>						<form onSubmit={handleSubmit} className="relative flex-1">
							<Input
								disabled={disabled}
								type={isPassword && !showPassword ? "password" : "text"}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSubmit(e as any);
									}
								}}
								onFocus={onFocus}
								placeholder={placeholder}
								className={`h-14 w-full rounded-full border-none bg-white pl-5 text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 md:text-md ${
									isPassword ? "pr-24" : "pr-14"
								}`}
							/>

							{/* Bouton œil pour les mots de passe */}
							{isPassword && (
								<Button
									type="button"
									size="icon"
									onClick={togglePasswordVisibility}
									className="-translate-y-1/2 absolute top-1/2 right-14 z-10 size-8 rounded-full p-1 text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 transition-all duration-300"
								>
									{showPassword ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</Button>
							)}

							<Button
								disabled={disabled || input.length === 0}
								type="submit"
								size="icon"
								className="-translate-y-1/2 absolute top-1/2 right-1.5 z-10 size-11 rounded-full p-2 text-white bg-orange-500 hover:bg-orange-600 transition-all duration-300"
							>
								<SendHorizonal className="size-6" />
							</Button>
						</form>
					</div>
				</div>
			</div>		</>
	);
}
