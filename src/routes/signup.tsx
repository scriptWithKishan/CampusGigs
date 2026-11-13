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
	Building2,
	CheckCircle2,
	Clock,
	Eye,
	EyeOff,
	GraduationCap,
	Loader2,
	Lock,
	Mail,
	School,
	User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import { getCollegesFn, getCurrentUserFn, signUpFn } from "../server/authFns";

export const Route = createFileRoute("/signup")({
	beforeLoad: async () => {
		const user = await getCurrentUserFn();
		if (user) {
			throw redirect({
				to: "/dashboard",
			});
		}
	},
	loader: async () => {
		const colleges = await getCollegesFn();
		return { colleges };
	},
	component: SignupPage,
});

function SignupPage() {
	const router = useRouter();
	const { colleges } = Route.useLoaderData();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<"STUDENT" | "COLLEGE_ADMIN">("STUDENT");
	const [collegeName, setCollegeName] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [applicationSubmitted, setApplicationSubmitted] = useState(false);
	const [submittedCollegeName, setSubmittedCollegeName] = useState("");
	const [submittedRole, setSubmittedRole] = useState<
		"STUDENT" | "COLLEGE_ADMIN"
	>("STUDENT");

	const handleRoleChange = (newRole: "STUDENT" | "COLLEGE_ADMIN") => {
		setRole(newRole);
		setCollegeName("");
		setErrorMessage(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);

		if (role === "STUDENT" && colleges.length === 0) {
			setErrorMessage(
				"No active university portals yet. College administrators must apply and be approved by the Super Admin before students can register.",
			);
			return;
		}

		if (!name.trim() || !email.trim() || !password || !collegeName.trim()) {
			setErrorMessage(
				role === "STUDENT"
					? "Please fill in all fields and select your university."
					: "Please fill in all required fields.",
			);
			return;
		}

		if (role === "STUDENT" && !colleges.includes(collegeName.trim())) {
			setErrorMessage(
				"Please select an approved participating university from the list.",
			);
			return;
		}

		if (password.length < 6) {
			setErrorMessage("Password must be at least 6 characters long.");
			return;
		}

		try {
			setLoading(true);
			const res = await signUpFn({
				data: {
					name: name.trim(),
					email: email.trim(),
					password,
					role,
					collegeName: collegeName.trim(),
				},
			});

			if (res.pendingApproval) {
				setSubmittedRole(role);
				setSubmittedCollegeName(collegeName.trim());
				setApplicationSubmitted(true);
				return;
			}

			// Invalidate route cache to refresh auth state in root and redirect to dashboard
			await router.invalidate();
			await router.navigate({ to: "/dashboard" });
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: "Registration failed. Please check your details and try again.";
			setErrorMessage(message);
		} finally {
			setLoading(false);
		}
	};

	if (applicationSubmitted) {
		const targetCollege = submittedCollegeName || collegeName;
		const isStudentApp = submittedRole === "STUDENT";

		return (
			<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
				<div className="w-full max-w-lg space-y-6">
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

					{isStudentApp ? (
						<Card className="border-border shadow-sm bg-card text-card-foreground">
							<CardHeader className="space-y-3 text-center pb-3">
								<div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
									<Clock className="w-6 h-6" />
								</div>
								<CardTitle className="text-2xl font-bold tracking-tight text-foreground">
									Student Application Submitted for Verification!
								</CardTitle>
								<CardDescription className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
									Your application to join the {targetCollege} portal has been
									submitted to your campus administrator. Once accepted, you
									will be able to log in to access your student workspace.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-5 pt-2">
								<div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2.5 text-xs">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground font-medium">
											Requested Campus
										</span>
										<span className="font-semibold text-foreground flex items-center gap-1.5">
											<School className="w-3.5 h-3.5 text-primary" />
											{targetCollege}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground font-medium">
											Applicant Role
										</span>
										<span className="font-semibold text-foreground flex items-center gap-1.5">
											<GraduationCap className="w-3.5 h-3.5 text-primary" />
											Student Freelancer
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground font-medium">
											Review Status
										</span>
										<Badge
											variant="outline"
											className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/40 font-medium text-[11px] gap-1"
										>
											<Clock className="w-3 h-3" />
											Awaiting College Admin Approval
										</Badge>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3 pt-1">
									<Button
										variant="outline"
										asChild
										className="w-full h-10 font-semibold"
									>
										<Link to="/">Back to Home</Link>
									</Button>
									<Button asChild className="w-full h-10 font-semibold">
										<Link to="/login">Back to Login</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					) : (
						<Card className="border-border shadow-sm bg-card text-card-foreground">
							<CardHeader className="space-y-3 text-center pb-3">
								<div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
									<Clock className="w-6 h-6" />
								</div>
								<CardTitle className="text-2xl font-bold tracking-tight text-foreground">
									Application Submitted for Review!
								</CardTitle>
								<CardDescription className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
									Your application to create the {targetCollege} portal has been
									submitted to the Super Admin. Once accepted, you will be able
									to log in to manage your campus.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-5 pt-2">
								<div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2.5 text-xs">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground font-medium">
											Requested Campus
										</span>
										<span className="font-semibold text-foreground flex items-center gap-1.5">
											<School className="w-3.5 h-3.5 text-primary" />
											{targetCollege}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground font-medium">
											Review Status
										</span>
										<Badge
											variant="outline"
											className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/40 font-medium text-[11px] gap-1"
										>
											<CheckCircle2 className="w-3 h-3" />
											Awaiting Super Admin Approval
										</Badge>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3 pt-1">
									<Button
										variant="outline"
										asChild
										className="w-full h-10 font-semibold"
									>
										<Link to="/">Back to Home</Link>
									</Button>
									<Button asChild className="w-full h-10 font-semibold">
										<Link to="/login">Go to Login</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		);
	}

	const isStudentWithoutColleges = role === "STUDENT" && colleges.length === 0;

	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
			<div className="w-full max-w-lg space-y-6">
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

				{/* Shadcn Card for Signup */}
				<Card className="border-border shadow-sm bg-card text-card-foreground">
					<CardHeader className="space-y-1.5 text-center">
						<div className="flex justify-center mb-1">
							<Badge variant="outline" className="text-xs px-2.5 py-0.5">
								University Marketplace
							</Badge>
						</div>
						<CardTitle className="text-2xl font-bold tracking-tight text-foreground">
							Create your account
						</CardTitle>
						<CardDescription className="text-sm text-muted-foreground">
							Join your university network to find gigs or hire campus talent
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-5">
						{errorMessage && (
							<div
								role="alert"
								className="flex items-start gap-3 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
							>
								<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
								<div className="flex-1 text-xs font-medium leading-relaxed">
									{errorMessage}
								</div>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							{/* Role Selector with Interactive Toggle and Accent Highlight */}
							<div className="space-y-2">
								<Label className="text-xs font-medium text-foreground">
									I am joining as
								</Label>
								<div
									role="radiogroup"
									aria-label="Account role"
									className="grid grid-cols-2 gap-3"
								>
									<button
										type="button"
										onClick={() => handleRoleChange("STUDENT")}
										className={`group relative flex flex-col items-start gap-1.5 p-3.5 rounded-lg border text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring ${
											role === "STUDENT"
												? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/40"
												: "border-border bg-card hover:bg-muted/50 text-muted-foreground"
										}`}
									>
										<div className="flex items-center justify-between w-full">
											<div className="flex items-center gap-2 font-semibold text-sm text-foreground">
												<GraduationCap
													className={`w-4 h-4 ${
														role === "STUDENT"
															? "text-primary"
															: "text-muted-foreground"
													}`}
												/>
												Student
											</div>
											{role === "STUDENT" && (
												<Badge
													variant="default"
													className="text-[10px] px-1.5 py-0"
												>
													Selected
												</Badge>
											)}
										</div>
										<span className="text-xs text-muted-foreground leading-normal">
											Find gigs, apply to jobs &amp; earn money
										</span>
									</button>

									<button
										type="button"
										onClick={() => handleRoleChange("COLLEGE_ADMIN")}
										className={`group relative flex flex-col items-start gap-1.5 p-3.5 rounded-lg border text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring ${
											role === "COLLEGE_ADMIN"
												? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/40"
												: "border-border bg-card hover:bg-muted/50 text-muted-foreground"
										}`}
									>
										<div className="flex items-center justify-between w-full">
											<div className="flex items-center gap-2 font-semibold text-sm text-foreground">
												<Building2
													className={`w-4 h-4 ${
														role === "COLLEGE_ADMIN"
															? "text-primary"
															: "text-muted-foreground"
													}`}
												/>
												College Admin
											</div>
											{role === "COLLEGE_ADMIN" && (
												<Badge
													variant="default"
													className="text-[10px] px-1.5 py-0"
												>
													Selected
												</Badge>
											)}
										</div>
										<span className="text-xs text-muted-foreground leading-normal">
											Post campus gigs &amp; manage student talent
										</span>
									</button>
								</div>
							</div>

							{/* Full Name */}
							<div className="space-y-1.5">
								<Label
									htmlFor="name"
									className="text-xs font-medium text-foreground"
								>
									Full Name
								</Label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
										<UserIcon className="h-4 w-4" />
									</div>
									<Input
										id="name"
										name="name"
										type="text"
										required
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Alex Johnson"
										className="pl-9 h-10 bg-background"
									/>
								</div>
							</div>

							{/* Campus Email */}
							<div className="space-y-1.5">
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
										placeholder="alex@university.edu"
										className="pl-9 h-10 bg-background"
									/>
								</div>
							</div>

							{/* College or University Field */}
							<div className="space-y-1.5">
								<Label
									htmlFor="collegeName"
									className="text-xs font-medium text-foreground"
								>
									{role === "COLLEGE_ADMIN"
										? "College or University Name to Register"
										: "University or College"}
								</Label>

								{role === "STUDENT" ? (
									<>
										{colleges.length === 0 && (
											<div
												role="alert"
												className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium leading-relaxed"
											>
												<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
												<div>
													No active university portals yet. College
													administrators must apply and be approved by the Super
													Admin before students can register.
												</div>
											</div>
										)}

										<Select
											value={collegeName}
											disabled={colleges.length === 0}
											onValueChange={(val) => {
												setCollegeName(val);
												setErrorMessage(null);
											}}
										>
											<SelectTrigger
												id="collegeName"
												disabled={colleges.length === 0}
												className="w-full h-10 bg-background text-sm"
											>
												<div className="flex items-center gap-2 truncate">
													<School className="h-4 w-4 text-muted-foreground shrink-0" />
													<SelectValue
														placeholder={
															colleges.length === 0
																? "No approved universities available"
																: "Select your university or college..."
														}
													/>
												</div>
											</SelectTrigger>
											{colleges.length > 0 && (
												<SelectContent className="max-h-60">
													{colleges.map((college) => (
														<SelectItem key={college} value={college}>
															{college}
														</SelectItem>
													))}
												</SelectContent>
											)}
										</Select>
										<p className="text-[11px] text-muted-foreground">
											{colleges.length === 0
												? "Registration will open as soon as your campus portal is approved."
												: "Only students from participating universities can join."}
										</p>
									</>
								) : (
									<>
										<div className="relative">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
												<School className="h-4 w-4" />
											</div>
											<Input
												id="collegeName"
												name="collegeName"
												type="text"
												required
												value={collegeName}
												onChange={(e) => {
													setCollegeName(e.target.value);
													setErrorMessage(null);
												}}
												placeholder="e.g. Stanford University or your campus"
												className="pl-9 h-10 bg-background"
											/>
										</div>
										<p className="text-[11px] text-muted-foreground">
											Apply to establish your university on CampusGigs. Requires
											Super Admin approval before going live.
										</p>
									</>
								)}
							</div>

							{/* Password */}
							<div className="space-y-1.5">
								<Label
									htmlFor="password"
									className="text-xs font-medium text-foreground"
								>
									Password (min. 6 characters)
								</Label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
										<Lock className="h-4 w-4" />
									</div>
									<Input
										id="password"
										name="password"
										type={showPassword ? "text" : "password"}
										autoComplete="new-password"
										required
										minLength={6}
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

							<div className="space-y-1.5 pt-1">
								<Button
									type="submit"
									disabled={loading || isStudentWithoutColleges}
									className="w-full h-10 font-semibold transition-all mt-2"
								>
									{loading ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											<span>
												{role === "COLLEGE_ADMIN"
													? "Submitting application..."
													: "Creating account..."}
											</span>
										</>
									) : isStudentWithoutColleges ? (
										<span>Awaiting campus portal approval</span>
									) : (
										<>
											<span>
												{role === "COLLEGE_ADMIN"
													? "Submit Portal Application"
													: "Create Account"}
											</span>
											<ArrowRight className="w-4 h-4 ml-1" />
										</>
									)}
								</Button>
								{isStudentWithoutColleges && (
									<p className="text-xs text-center text-muted-foreground">
										Awaiting campus portal approval
									</p>
								)}
							</div>
						</form>

						<div className="border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
							Already have an account?{" "}
							<Link
								to="/login"
								className="font-medium text-primary hover:underline transition-colors"
							>
								Sign in
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
