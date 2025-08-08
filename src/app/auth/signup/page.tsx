/**
 * Signup page for creating new user accounts
 *
 * This page allows new users to create an account
 * by providing an email and password. A user profile
 * is automatically created in the database after signup.
 *
 * Features:
 * - Signup form with validation
 * - Automatic user profile creation
 * - Signup error handling
 * - Email confirmation required
 * - Link to login page
 *
 * @component
 * @example
 * // Used automatically by Next.js for the /auth/signup route
 * <SignupPage />
 */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createClient } from "~/utils/supabase/client";

/**
 * Signup page component
 * Handles creation of new user accounts via Supabase Auth
 */
export default function SignupPage() {
	// States to manage form data and messages
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [passwordError, setPasswordError] = useState("");
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
	 * Validates password format according to defined criteria
	 *
	 * @param password - Password to validate
	 * @returns string - Error message or empty string if valid
	 */
	const validatePassword = (password: string): string => {
		if (password.length < 6) {
			return "Password must contain at least 6 characters";
		}
		if (!/(?=.*[a-z])/.test(password)) {
			return "Password must contain at least one lowercase letter";
		}
		if (!/(?=.*[A-Z])/.test(password)) {
			return "Password must contain at least one uppercase letter";
		}
		if (!/(?=.*\d)/.test(password)) {
			return "Password must contain at least one number";
		}
		return "";
	};
	/**
	 * Handles password change with real-time validation
	 *
	 * @param value - New password value
	 */
	const handlePasswordChange = (value: string) => {
		setPassword(value);
		setPasswordError(validatePassword(value));
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
	 * Handles signup form submission
	 * Creates a new user account and its associated profile
	 *
	 * @param e - Form submission event
	 * @returns Promise<void>
	 */
	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");
		setMessage("");

		// Field validation before submission
		const emailValidationError = validateEmail(email);
		const passwordValidationError = validatePassword(password);

		if (emailValidationError) {
			setEmailError(emailValidationError);
			setIsLoading(false);
			return;
		}

		if (passwordValidationError) {
			setPasswordError(passwordValidationError);
			setIsLoading(false);
			return;
		}
		try {
			// User account creation with Supabase Auth
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
			});

			if (error) {
				setError(error.message);
			} else {
                // Ensure user profile exists (server-side to bypass RLS issues)
                if (data.user?.email) {
                    await createUserProfile(data.user.email);
                }
				// Automatic redirection to questionnaire after successful signup
				setMessage(
					"Account created successfully. Redirecting to questionnaire...",
				);
				router.push("/protected/questionnaire");
			}
		} catch (err) {
			setError("An error occurred");
		} finally {
			setIsLoading(false);
		}
	};
	/**
	 * Creates a user profile in the users_table
	 * Initializes AI memory fields for the new user
	 *
	 * @param email - Email of the user for whom to create the profile
	 * @returns Promise<void>
     */ const createUserProfile = async (email: string) => {
        try {
            const res = await fetch("/api/users/ensure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                console.error("Error ensuring profile:", payload);
            }
        } catch (err) {
            console.error("Error ensuring profile:", err);
        }
    };

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-6 rounded-lg border p-6">
				<h1 className="text-center font-bold text-2xl">Sign Up</h1>
				<form onSubmit={handleSignup} className="space-y-4">
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
							onChange={(e) => handlePasswordChange(e.target.value)}
							required
						/>
						{passwordError && (
							<div className="mt-1 text-red-500 text-xs">{passwordError}</div>
						)}
						<div className="mt-1 text-gray-500 text-xs">
							Password must contain at least 6 characters, one
							uppercase letter, one lowercase letter and one number
						</div>
					</div>
					{error && <div className="text-red-500 text-sm">{error}</div>}
					{message && <div className="text-green-500 text-sm">{message}</div>}{" "}
					<Button
						type="submit"
						className="w-full"
						disabled={isLoading || passwordError !== "" || emailError !== ""}
					>
						{isLoading ? "Signing up..." : "Sign up"}
					</Button>
				</form>

				<div className="text-center">
					<a href="/auth/login" className="text-blue-500 hover:underline">
						Already have an account? Sign in
					</a>
				</div>
			</div>
		</div>
	);
}
