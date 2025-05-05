import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";

interface StatePopupProps {
	isOpen: boolean;
	onClose: () => void;
	type: "success" | "error";
	message: string;
}

export function StatePopup({
	isOpen,
	onClose,
	type,
	message,
}: StatePopupProps) {
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				onClose();
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [isOpen, onClose]);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -50 }}
					className="fixed inset-0 z-50 flex items-center justify-center"
					onClick={onClose}
				>
					<motion.div
						className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="text-center">
							<div
								className={`mb-4 ${type === "success" ? "text-green-500" : "text-red-500"}`}
							>
								{type === "success" ? (
									// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
									<svg
										className="mx-auto h-12 w-12"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								) : (
									// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
									<svg
										className="mx-auto h-12 w-12"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								)}
							</div>
							<h3 className="mb-2 font-semibold text-gray-900 text-xl">
								{type === "success" ? "Succès !" : "Erreur !"}
							</h3>
							<p className="text-gray-600">{message}</p>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
