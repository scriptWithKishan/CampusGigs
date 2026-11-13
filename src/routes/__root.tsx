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
import {
	Briefcase,
	LayoutDashboard,
	Loader2,
	LogOut,
	Menu,
	Shield,
	X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
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

	return (
		<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-colors">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Brand Logo & Name */}
					<Link to="/" className="flex items-center gap-2.5 group">
						<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/25 group-hover:scale-105 transition-transform">
							<Briefcase className="w-5 h-5" />
						</div>
						<div className="flex flex-col">
							<span className="font-serif text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition leading-none">
								Campus<span className="text-primary">Gigs</span>
							</span>
							<span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase mt-0.5">
								Campus Marketplace
							</span>
						</div>
					</Link>

					{/* Desktop Navigation Links */}
					<nav className="hidden md:flex items-center gap-6">
						<Link
							to="/"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
							activeProps={{ className: "text-foreground font-semibold" }}
						>
							Explore
						</Link>

						<Link
							to="/gigs"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
							activeProps={{ className: "text-foreground font-semibold" }}
						>
							Browse Gigs
						</Link>

						{user ? (
							<div className="flex items-center gap-3 pl-4 border-l border-border">
								{user.role === "SUPER_ADMIN" && (
									<Button
										variant="default"
										size="sm"
										asChild
										className="gap-1.5 shadow-xs font-semibold"
									>
										<Link to="/admin">
											<Shield className="w-3.5 h-3.5" />
											<span>Admin Console</span>
										</Link>
									</Button>
								)}

								<Button
									variant="outline"
									size="sm"
									asChild
									className="gap-2 border-border text-foreground hover:bg-secondary"
								>
									<Link to="/dashboard">
										<LayoutDashboard className="w-4 h-4 text-primary" />
										<span>Dashboard</span>
									</Link>
								</Button>

								{/* User chip */}
								<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs text-secondary-foreground border border-border">
									<div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px]">
										{user.name.charAt(0).toUpperCase()}
									</div>
									<span className="font-medium text-foreground max-w-[120px] truncate">
										{user.name}
									</span>
									<span className="text-muted-foreground">•</span>
									<Badge
										variant="outline"
										className="border-border/60 bg-background/50 text-[10px] text-primary font-semibold py-0 px-1.5 h-4"
									>
										{user.role === "SUPER_ADMIN"
											? "Super Admin"
											: user.role === "STUDENT"
												? "Student"
												: "College Admin"}
									</Badge>
								</div>

								<Button
									variant="ghost"
									size="sm"
									onClick={handleLogout}
									disabled={loggingOut}
									className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
									title="Log out of CampusGigs"
								>
									{loggingOut ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<LogOut className="w-4 h-4" />
									)}
									<span>Logout</span>
								</Button>
							</div>
						) : (
							<div className="flex items-center gap-3 pl-4 border-l border-border">
								<Button variant="ghost" size="sm" asChild>
									<Link
										to="/login"
										className="text-muted-foreground hover:text-foreground font-medium"
									>
										Login
									</Link>
								</Button>
								<Button
									size="sm"
									asChild
									className="font-semibold shadow-xs shadow-primary/25"
								>
									<Link to="/signup">Sign Up</Link>
								</Button>
							</div>
						)}
					</nav>

					{/* Mobile Menu Toggle */}
					<div className="flex md:hidden items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="text-foreground"
							aria-label="Toggle navigation menu"
						>
							{mobileMenuOpen ? (
								<X className="w-5 h-5" />
							) : (
								<Menu className="w-5 h-5" />
							)}
						</Button>
					</div>
				</div>
			</div>

			{/* Mobile Dropdown Menu */}
			{mobileMenuOpen && (
				<div className="md:hidden border-b border-border bg-background/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-3">
					<Link
						to="/"
						onClick={() => setMobileMenuOpen(false)}
						className="block px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-secondary transition-colors"
					>
						Explore
					</Link>

					<Link
						to="/gigs"
						onClick={() => setMobileMenuOpen(false)}
						className="block px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-secondary transition-colors"
					>
						Browse Gigs
					</Link>

					{user ? (
						<>
							<div className="px-3 py-2 bg-secondary/80 rounded-xl border border-border flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
										{user.name.charAt(0).toUpperCase()}
									</div>
									<div>
										<div className="text-sm font-bold text-foreground">
											{user.name}
										</div>
										<div className="text-xs text-muted-foreground">
											{user.collegeName}
										</div>
									</div>
								</div>
								<Badge
									variant="outline"
									className="border-border bg-background text-primary font-semibold"
								>
									{user.role}
								</Badge>
							</div>

							{user.role === "SUPER_ADMIN" && (
								<Button
									asChild
									className="w-full justify-start gap-2 shadow-xs"
								>
									<Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
										<Shield className="w-5 h-5" />
										<span>Admin Console</span>
									</Link>
								</Button>
							)}

							<Button
								asChild
								variant={user.role === "SUPER_ADMIN" ? "outline" : "default"}
								className="w-full justify-start gap-2 shadow-xs shadow-primary/25"
							>
								<Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
									<LayoutDashboard className="w-5 h-5" />
									<span>Dashboard</span>
								</Link>
							</Button>

							<Button
								variant="outline"
								onClick={handleLogout}
								disabled={loggingOut}
								className="w-full justify-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
							>
								{loggingOut ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<LogOut className="w-4 h-4" />
								)}
								<span>Logout</span>
							</Button>
						</>
					) : (
						<div className="grid grid-cols-2 gap-3 pt-2">
							<Button variant="outline" asChild className="w-full">
								<Link to="/login" onClick={() => setMobileMenuOpen(false)}>
									Login
								</Link>
							</Button>
							<Button asChild className="w-full shadow-xs shadow-primary/25">
								<Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
									Sign Up
								</Link>
							</Button>
						</div>
					)}
				</div>
			)}
		</header>
	);
}

function Footer() {
	return (
		<footer className="border-t border-border bg-card/60 py-8 px-4 sm:px-6 lg:px-8 text-muted-foreground text-sm">
			<div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
				<div className="flex items-center gap-2.5">
					<div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
						<Briefcase className="w-3.5 h-3.5" />
					</div>
					<span className="font-semibold text-foreground">CampusGigs</span>
					<span className="text-muted-foreground/80">
						© {new Date().getFullYear()} All rights reserved.
					</span>
				</div>
				<div className="flex items-center gap-6 text-xs font-medium text-muted-foreground">
					<Link to="/" className="hover:text-foreground transition-colors">
						Privacy Policy
					</Link>
					<Link to="/" className="hover:text-foreground transition-colors">
						Terms of Service
					</Link>
					<Link to="/" className="hover:text-foreground transition-colors">
						Campus Guidelines
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
