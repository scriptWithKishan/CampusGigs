import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Building2,
	CheckCircle2,
	GraduationCap,
	LayoutDashboard,
	Lock,
	ShieldCheck,
	Sparkles,
	Wallet,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { getCurrentUserFn } from "../server/authFns";

export const Route = createFileRoute("/")({
	loader: async () => {
		const user = await getCurrentUserFn();
		return { user };
	},
	component: HomePage,
});

function HomePage() {
	const { user } = Route.useLoaderData();

	return (
		<div className="flex flex-col min-h-screen bg-background">
			{/* Minimalist Grayscale Hero Section */}
			<section className="relative overflow-hidden py-20 lg:py-28 border-b border-border/60">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
					<div className="flex justify-center">
						<Badge
							variant="outline"
							className="px-3.5 py-1 text-xs font-medium gap-1.5 border-border shadow-2xs"
						>
							<Sparkles className="w-3.5 h-3.5 text-primary" />
							<span>Campus Freelance &amp; Gig Marketplace</span>
						</Badge>
					</div>

					<div className="space-y-4 max-w-3xl mx-auto">
						<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.12]">
							Work campus gigs, <span className="text-primary">earn money</span>
							, and elevate your resume.
						</h1>
						<p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
							CampusGigs connects university students with campus departments,
							student organizations, and local initiatives for flexible,
							well-compensated project work.
						</p>
					</div>

					{/* Vibrant Purple Primary CTA Buttons */}
					<div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
						{user ? (
							<div className="flex flex-col items-center gap-3">
								<Button
									asChild
									size="lg"
									className="h-11 px-6 font-semibold shadow-xs"
								>
									<Link to="/dashboard">
										<LayoutDashboard className="w-4 h-4 mr-2" />
										<span>Go to Dashboard</span>
										<ArrowRight className="w-4 h-4 ml-2" />
									</Link>
								</Button>
								<p className="text-xs text-muted-foreground">
									Signed in as{" "}
									<span className="font-semibold text-foreground">
										{user.name}
									</span>{" "}
									({user.collegeName})
								</p>
							</div>
						) : (
							<>
								<Button
									asChild
									size="lg"
									className="h-11 px-6 font-semibold shadow-xs"
								>
									<Link to="/signup">
										<span>Get Started</span>
										<ArrowRight className="w-4 h-4 ml-2" />
									</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									size="lg"
									className="h-11 px-6 font-semibold border-border text-foreground hover:bg-muted/60"
								>
									<Link to="/login">
										<span>Sign In</span>
									</Link>
								</Button>
							</>
						)}
					</div>

					{/* Trust Badges */}
					<div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-muted-foreground border-t border-border/40 max-w-2xl mx-auto">
						<div className="flex items-center gap-1.5">
							<CheckCircle2 className="w-4 h-4 text-primary" />
							<span>Verified .edu Emails</span>
						</div>
						<div className="flex items-center gap-1.5">
							<ShieldCheck className="w-4 h-4 text-primary" />
							<span>JWT Secure Auth</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Wallet className="w-4 h-4 text-primary" />
							<span>Escrow-Protected Payouts</span>
						</div>
					</div>
				</div>
			</section>

			{/* Features Grid using Shadcn Cards */}
			<section className="py-16 sm:py-24 bg-muted/20">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
					<div className="text-center max-w-2xl mx-auto space-y-2">
						<Badge variant="secondary" className="text-xs">
							Built for Higher Ed
						</Badge>
						<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
							Everything your campus community needs
						</h2>
						<p className="text-sm text-muted-foreground">
							A streamlined platform created specifically to support student
							schedules and college administrative policies.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Card 1: Students */}
						<Card className="border-border shadow-xs bg-card transition-all hover:border-primary/50">
							<CardHeader className="space-y-3 pb-4">
								<div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
									<GraduationCap className="w-5 h-5" />
								</div>
								<CardTitle className="text-lg font-bold text-foreground">
									For Student Freelancers
								</CardTitle>
								<CardDescription className="text-xs text-muted-foreground leading-relaxed">
									Convert your software, writing, design, research, or event
									skills into immediate income without sacrificing academic
									deadlines.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2.5 text-xs text-muted-foreground">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
									<span>Student-first schedule flexibility</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
									<span>Portfolio building with university backing</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
									<span>Direct campus milestone payouts</span>
								</div>
							</CardContent>
						</Card>

						{/* Card 2: Admins */}
						<Card className="border-border shadow-xs bg-card transition-all hover:border-primary/50">
							<CardHeader className="space-y-3 pb-4">
								<div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
									<Building2 className="w-5 h-5" />
								</div>
								<CardTitle className="text-lg font-bold text-foreground">
									For College Administrators
								</CardTitle>
								<CardDescription className="text-xs text-muted-foreground leading-relaxed">
									Hire talented students for labs, departmental projects, IT
									support, and student union events with zero external vendor
									friction.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2.5 text-xs text-muted-foreground">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
									<span>Instant student enrollment verification</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
									<span>Department budget tracking &amp; approvals</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
									<span>Empower and retain on-campus talent</span>
								</div>
							</CardContent>
						</Card>

						{/* Card 3: Security & Tech */}
						<Card className="border-border shadow-xs bg-card transition-all hover:border-primary/50">
							<CardHeader className="space-y-3 pb-4">
								<div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
									<Lock className="w-5 h-5" />
								</div>
								<CardTitle className="text-lg font-bold text-foreground">
									Security &amp; Reliability
								</CardTitle>
								<CardDescription className="text-xs text-muted-foreground leading-relaxed">
									Enterprise-grade safeguards ensuring student data privacy,
									tamper-proof JWT session tokens, and encrypted credentials.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2.5 text-xs text-muted-foreground">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
									<span>HTTP-only cookie JWT architecture</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
									<span>Industry standard bcrypt password hashing</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
									<span>Strict university domain validation</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Minimalist Bottom CTA Banner using Shadcn Card */}
			<section className="py-16 px-4 sm:px-6 lg:px-8">
				<div className="max-w-4xl mx-auto">
					<Card className="border-border shadow-sm bg-card p-8 sm:p-12 text-center space-y-6">
						<div className="max-w-xl mx-auto space-y-2">
							<h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
								Ready to join the campus network?
							</h3>
							<p className="text-xs sm:text-sm text-muted-foreground">
								Join university students, professors, and administrators on
								CampusGigs today.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
							{user ? (
								<Button asChild size="lg" className="h-10 px-6 font-semibold">
									<Link to="/dashboard">
										<LayoutDashboard className="w-4 h-4 mr-2" />
										<span>Open Dashboard</span>
									</Link>
								</Button>
							) : (
								<>
									<Button asChild size="lg" className="h-10 px-6 font-semibold">
										<Link to="/signup">
											<span>Create Your Account</span>
											<ArrowRight className="w-4 h-4 ml-2" />
										</Link>
									</Button>
									<Button
										asChild
										variant="outline"
										size="lg"
										className="h-10 px-6 font-semibold border-border text-foreground hover:bg-muted/60"
									>
										<Link to="/login">
											<span>Sign In</span>
										</Link>
									</Button>
								</>
							)}
						</div>
					</Card>
				</div>
			</section>
		</div>
	);
}
