/**
 * Validates and resolves a redirect path to ensure it is a safe same-origin
 * relative path starting with a single '/' and not an external or protocol-relative target.
 */
export function getSafeRedirect(redirectUrl: unknown, role?: string): string {
	const defaultPath = role === "SUPER_ADMIN" ? "/admin" : "/dashboard";

	if (typeof redirectUrl !== "string") {
		return defaultPath;
	}

	const trimmed = redirectUrl.trim();

	// Must start with '/' and not '//' or '/\', and contain no backslashes
	if (
		!trimmed.startsWith("/") ||
		trimmed.startsWith("//") ||
		trimmed.startsWith("/\\") ||
		trimmed.includes("\\")
	) {
		return defaultPath;
	}

	try {
		const parsed = new URL(trimmed, "http://localhost");

		// Prevent origin breakouts
		if (parsed.origin !== "http://localhost") {
			return defaultPath;
		}

		// Ensure normalized pathname remains relative
		if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) {
			return defaultPath;
		}

		// Prevent redirecting back to login or signup
		if (parsed.pathname === "/login" || parsed.pathname === "/signup") {
			return defaultPath;
		}

		// Protect admin area from non-super admins
		if (
			role !== "SUPER_ADMIN" &&
			(parsed.pathname === "/admin" || parsed.pathname.startsWith("/admin/"))
		) {
			return "/dashboard";
		}

		return `${parsed.pathname}${parsed.search}${parsed.hash}`;
	} catch {
		return defaultPath;
	}
}
