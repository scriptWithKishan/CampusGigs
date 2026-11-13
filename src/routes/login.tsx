import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowRight,
	Briefcase,
	Clock,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getCurrentUserFn, logInFn } from "../server/authFns";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const user = await getCurrentUserFn();
		if (user) {
			if (user.role === "SUPER_ADMIN") {
				throw redirect({
					to: "/admin",
				});
			}
			throw redirect({
				to: "/dashboard",
			});
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const isPendingReview = Boolean(
		errorMessage?.toLowerCase().includes("pending review"),
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);

		if (!email.trim() || !password) {
			setErrorMessage("Please enter both your campus email and password.");
			return;
		}

		try {
			setLoading(true);
			const authRes = await logInFn({
				data: {
					email: email.trim(),
					password,
				},
			});

			// Invalidate route cache to refresh auth state in root and redirect
			await router.invalidate();
			if (authRes.user?.role === "SUPER_ADMIN") {
				await router.navigate({ to: "/admin" });
			} else {
				await router.navigate({ to: "/dashboard" });
			}
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: "Invalid credentials. Please verify your email and password.";
			setErrorMessage(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
			<div className="w-full max-w-md space-y-6">
				{/* Top Branding */}
				<div className="flex flex-col items-center text-center space-y-2">
					<Link
						to="/"
						className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
					>
						<div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
							<Briefcase className="w-5 h-5" />
						</div>
						<span className="text-xl font-bold tracking-tight text-foreground">
							Campus<span className="text-primary">Gigs</span>
						</span>
					</Link>
				</div>

				{/* Shadcn Card for Login */}
				<Card className="border-border shadow-sm bg-card text-card-foreground">
					<CardHeader className="space-y-1.5 text-center">
						<CardTitle className="text-2xl font-bold tracking-tight text-foreground">
							Welcome back
						</CardTitle>
						<CardDescription className="text-sm text-muted-foreground">
							Enter your campus credentials to sign in to your account
						</CardDescription>
					</CardHeader>

					<CardContent>
						{errorMessage &&
							(isPendingReview ? (
								<div
									role="alert"
									className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground space-y-2 shadow-xs"
								>
									<div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
										<Clock className="w-4 h-4 shrink-0" />
										<span>Application Under Review</span>
									</div>
									<p className="text-xs text-muted-foreground leading-relaxed pl-6">
										{errorMessage}
									</p>
								</div>
							) : (
								<div
									role="alert"
									className="mb-5 flex items-start gap-3 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
								>
									<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
									<div className="flex-1 text-xs font-medium leading-relaxed">
										{errorMessage}
									</div>
								</div>
							))}

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label
									htmlFor="email"
									className="text-xs font-medium text-foreground"
								>
									Campus Email
								</Label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
										<Mail className="h-4 w-4" />
									</div>
									<Input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="student@university.edu"
										className="pl-9 h-10 bg-background"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label
										htmlFor="password"
										className="text-xs font-medium text-foreground"
									>
										Password
									</Label>
									<span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
										Forgot password?
									</span>
								</div>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
										<Lock className="h-4 w-4" />
									</div>
									<Input
										id="password"
										name="password"
										type={showPassword ? "text" : "password"}
										autoComplete="current-password"
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="••••••••"
										className="pl-9 pr-10 h-10 bg-background"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
										aria-label={
											showPassword ? "Hide password" : "Show password"
										}
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>

							<Button
								type="submit"
								disabled={loading}
								className="w-full h-10 font-semibold transition-all mt-2"
							>
								{loading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Signing in...</span>
									</>
								) : (
									<>
										<span>Sign In</span>
										<ArrowRight className="w-4 h-4 ml-1" />
									</>
								)}
							</Button>
						</form>
					</CardContent>

					<CardFooter className="flex flex-col border-t border-border/60 pt-4 pb-6 text-center text-xs text-muted-foreground">
						<p>
							Don&apos;t have an account?{" "}
							<Link
								to="/signup"
								className="font-medium text-primary hover:underline transition-colors"
							>
								Create an account
							</Link>
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
