/**
 * Login page for user authentication
 *
 * This page allows existing users to sign in to their account
 * using their email and password. After successful authentication,
 * the user is redirected to the protected area of the application.
 *
 * Features:
 * - Login form with validation
 * - Authentication error handling
 * - Automatic redirection after login
 * - Link to signup page
 *
 * @component
 * @example
 * // Used automatically by Next.js for the /auth/login route
 * <LoginPage />
 */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createClient } from "~/utils/supabase/client";

/**
 * Login page component
 * Handles user authentication via Supabase Auth
 */
export default function LoginPage() {
	// States to manage form data
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [emailError, setEmailError] = useState("");

	// Hooks for navigation and authentication
	const router = useRouter();
	const supabase = createClient();

	/**
	 * Validates email format
	 *
	 * @param email - Email to validate
	 * @returns string - Error message or empty string if valid
	 */
	const validateEmail = (email: string): string => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email) {
			return "Email is required";
		}
		if (!emailRegex.test(email)) {
			return "Please enter a valid email";
		}
		return "";
	};

	/**
	 * Handles email change with real-time validation
	 *
	 * @param value - New email value
	 */
	const handleEmailChange = (value: string) => {
		setEmail(value);
		setEmailError(validateEmail(value));
	};

	/**
	 * Handles login form submission
	 *
	 * @param e - Form submission event
	 * @returns Promise<void>
	 */ const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		// Email validation before submission
		const emailValidationError = validateEmail(email);
		if (emailValidationError) {
			setEmailError(emailValidationError);
			setIsLoading(false);
			return;
		}

		try {
			// Login attempt with Supabase Auth
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				setError(error.message);
			} else {
				// Redirect to protected area after successful login
				router.push("/protected");
			}
		} catch (err) {
			setError("An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-6 rounded-lg border p-6">
				<h1 className="text-center font-bold text-2xl">Login</h1>
				<form onSubmit={handleLogin} className="space-y-4">
					<div>
						<Input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => handleEmailChange(e.target.value)}
							required
						/>
						{emailError && (
							<div className="mt-1 text-red-500 text-xs">{emailError}</div>
						)}
					</div>

					<div>
						<Input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					{error && <div className="text-red-500 text-sm">{error}</div>}

					<Button
						type="submit"
						className="w-full"
						disabled={isLoading || emailError !== ""}
					>
						{isLoading ? "Signing in..." : "Sign in"}
					</Button>
				</form>

				<div className="text-center">
					<a href="/auth/signup" className="text-blue-500 hover:underline">
						No account? Sign up
					</a>
				</div>
			</div>
		</div>
	);
}
