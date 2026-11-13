import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { connectDB } from "../lib/db";
import { type AuthUser, getCurrentUserFn, logOutFn } from "../server/authFns";
import { ensureSuperAdmin } from "../server/superAdmin";

import appCss from "../styles.css?url";

const ensureDbConnected = createServerFn().handler(async () => {
	try {
		await connectDB();
		await ensureSuperAdmin();
	} catch (err) {
		console.warn("MongoDB connection deferred in root:", err);
	}
});

export const Route = createRootRoute({
	beforeLoad: async () => {
		await ensureDbConnected();
		const user = await getCurrentUserFn();
		return { user };
	},
	loader: async ({ context }) => {
		return { user: context.user };
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "CampusGigs - University Freelance & Gigs Marketplace",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
});

function Navbar({ user }: { user: AuthUser | null }) {
	const router = useRouter();
	const [loggingOut, setLoggingOut] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const handleLogout = async () => {
		try {
			setLoggingOut(true);
			await logOutFn();
			await router.invalidate();
			await router.navigate({ to: "/login" });
		} catch (err) {
			console.error("Logout error:", err);
		} finally {
			setLoggingOut(false);
			setMobileMenuOpen(false);
		}
	};

	const navLinkClass =
		"relative py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-foreground hover:after:w-full after:transition-all after:duration-200";

	return (
		<header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-colors">
			<div className="flex items-center justify-between h-16 px-6 sm:px-8 lg:px-12">
				{/* Brand Wordmark & Main Nav */}
				<div className="flex items-center gap-10">
					<Link
						to="/"
						className="font-bold text-lg tracking-tight text-foreground hover:opacity-85 transition-opacity"
					>
						Campus<span className="text-primary">Gigs</span>
					</Link>

					{/* Desktop Navigation Links */}
					<nav className="hidden md:flex items-center gap-6">
						<Link
							to="/"
							activeOptions={{ exact: true }}
							className={navLinkClass}
							activeProps={{
								className:
									"text-foreground font-semibold after:!w-full after:!bg-foreground",
							}}
						>
							Explore
						</Link>

						{user && (
							<Link
								to="/gigs"
								className={navLinkClass}
								activeProps={{
									className:
										"text-foreground font-semibold after:!w-full after:!bg-foreground",
								}}
							>
								Gigs
							</Link>
						)}

						{user && (
							<Link
								to="/dashboard"
								className={navLinkClass}
								activeProps={{
									className:
										"text-foreground font-semibold after:!w-full after:!bg-foreground",
								}}
							>
								Dashboard
							</Link>
						)}

						{user?.role === "SUPER_ADMIN" && (
							<Link
								to="/admin"
								className={navLinkClass}
								activeProps={{
									className:
										"text-foreground font-semibold after:!w-full after:!bg-foreground",
								}}
							>
								Admin
							</Link>
						)}
					</nav>
				</div>

				{/* Right Side Actions */}
				<div className="hidden md:flex items-center gap-6">
					{user ? (
						<>
							<span className="text-xs text-muted-foreground">{user.name}</span>
							<button
								type="button"
								onClick={handleLogout}
								disabled={loggingOut}
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
							>
								{loggingOut ? "Logging out..." : "Log out"}
							</button>
						</>
					) : (
						<>
							<Link
								to="/login"
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
							>
								Log in
							</Link>
							<Link
								to="/signup"
								className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-3.5 py-1.5 rounded-md transition-colors"
							>
								Sign up
							</Link>
						</>
					)}
				</div>

				{/* Mobile Menu Toggle */}
				<div className="flex md:hidden items-center">
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Toggle navigation menu"
					>
						{mobileMenuOpen ? (
							<X className="w-5 h-5" />
						) : (
							<Menu className="w-5 h-5" />
						)}
					</button>
				</div>
			</div>

			{/* Mobile Dropdown Menu */}
			{mobileMenuOpen && (
				<div className="md:hidden border-b border-border bg-background px-6 pt-3 pb-5 space-y-3">
					<Link
						to="/"
						activeOptions={{ exact: true }}
						onClick={() => setMobileMenuOpen(false)}
						className="block py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
					>
						Explore
					</Link>

					{user && (
						<Link
							to="/gigs"
							onClick={() => setMobileMenuOpen(false)}
							className="block py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
						>
							Gigs
						</Link>
					)}

					{user && (
						<Link
							to="/dashboard"
							onClick={() => setMobileMenuOpen(false)}
							className="block py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
						>
							Dashboard
						</Link>
					)}

					{user?.role === "SUPER_ADMIN" && (
						<Link
							to="/admin"
							onClick={() => setMobileMenuOpen(false)}
							className="block py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
						>
							Admin
						</Link>
					)}

					<div className="pt-3 border-t border-border flex items-center justify-between">
						{user ? (
							<>
								<span className="text-xs text-muted-foreground truncate max-w-[180px]">
									{user.name}
								</span>
								<button
									type="button"
									onClick={handleLogout}
									disabled={loggingOut}
									className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
								>
									{loggingOut ? "Logging out..." : "Log out"}
								</button>
							</>
						) : (
							<div className="flex items-center gap-4 w-full">
								<Link
									to="/login"
									onClick={() => setMobileMenuOpen(false)}
									className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
								>
									Log in
								</Link>
								<Link
									to="/signup"
									onClick={() => setMobileMenuOpen(false)}
									className="text-sm font-medium text-primary-foreground bg-primary px-3.5 py-1.5 rounded-md"
								>
									Sign up
								</Link>
							</div>
						)}
					</div>
				</div>
			)}
		</header>
	);
}

function Footer() {
	return (
		<footer className="border-t border-border bg-background py-8 px-6 sm:px-8 lg:px-12 text-muted-foreground text-xs">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<span className="font-semibold text-foreground">CampusGigs</span>
					<span className="text-muted-foreground">
						— University freelance & project marketplace
					</span>
				</div>
				<div className="flex items-center gap-6">
					<span>© {new Date().getFullYear()}</span>
					<Link to="/" className="hover:text-foreground transition-colors">
						Privacy Policy
					</Link>
					<Link to="/" className="hover:text-foreground transition-colors">
						Terms of Service
					</Link>
				</div>
			</div>
		</footer>
	);
}

function RootComponent() {
	const { user } = Route.useRouteContext();

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-primary-foreground">
			<Navbar user={user} />
			<main className="flex-1">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
