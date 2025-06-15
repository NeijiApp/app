"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface CustomDrawerProps {
	isOpen: boolean;
	children: ReactNode;
	className?: string;
}

/**
 * A custom drawer component that slides up from behind the input
 * without using the shadcn Drawer component
 */
export function CustomDrawer({
	isOpen,
	children,
	className,
}: CustomDrawerProps) {
	return (
		<div
			className={cn(
				"fixed right-1/2 bottom-18 w-full max-w-xl translate-x-1/2 transition-all duration-300 ease-in-out",
				isOpen ? "h-[200px]" : "h-0",
				className,
			)}
		>
			<div className="h-full overflow-hidden rounded-t-2xl bg-white">
				<div className="p-10">{children}</div>
			</div>
		</div>
	);
}

/**
 * Content for the registration drawer with state management
 */
export function AskRegistrationDrawerContent({
	onClose,
}: { onClose: () => void }) {
	const [showEmailForm, setShowEmailForm] = useState(false);
	const [email, setEmail] = useState("");

	// Handle Yes button click
	const handleYesClick = () => {
		setShowEmailForm(true);
	};

	// Handle No button click
	const handleNoClick = () => {
		onClose();
	};

	// Handle email submission
	const handleSubmitEmail = () => {
		// Here you would typically handle the email submission
		// For now, we'll just close the drawer
		onClose();
	};

	// Show email form if user clicked Yes
	if (showEmailForm) {
		return (
			<>
				<h2 className="mb-4 text-center font-semibold text-lg">
					Entre ton email
				</h2>
				<div className="flex flex-col gap-4">
					<Input
						type="email"
						placeholder="ton@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="border-orange-200 focus-visible:ring-orange-400"
					/>
					<Button
						className="w-full bg-orange-400 text-white hover:bg-orange-500"
						onClick={handleSubmitEmail}
					>
						Confirmer
					</Button>
				</div>
			</>
		);
	}

	// Show initial registration question
	return (
		<>
			<h2 className="mb-4 text-center font-semibold text-lg">
				Veux-tu t'inscrire ?
			</h2>
			<div className="flex justify-center gap-4">
				<Button
					className="bg-orange-400 text-white hover:bg-orange-500"
					onClick={handleYesClick}
				>
					Oui
				</Button>
				<Button
					className="bg-orange-400 text-white hover:bg-orange-500"
					onClick={handleNoClick}
				>
					Non
				</Button>
			</div>
		</>
	);
}
