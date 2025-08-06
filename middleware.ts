import { updateSession } from "~/utils/supabase/middleware";
import { authMiddleware } from "~/middleware/auth";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
	// Apply auth middleware with rate limiting
	const authResponse = await authMiddleware(request);
	if (authResponse.status === 401 || authResponse.status === 429) {
		return authResponse;
	}
	
	// Apply Supabase session update
	return await updateSession(request);
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public assets
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
