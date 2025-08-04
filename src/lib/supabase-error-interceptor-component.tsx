"use client";

import { useEffect } from "react";
import { enableSupabaseDebugging } from "./supabase-error-interceptor";

export function SupabaseErrorInterceptor() {
	useEffect(() => {
		// Only run on client side
		if (typeof window !== "undefined") {
			console.log("🔍 Initializing Supabase Error Interceptor...");
			enableSupabaseDebugging();
		}
	}, []);

	// This component doesn't render anything, it just sets up error interception
	return null;
}
