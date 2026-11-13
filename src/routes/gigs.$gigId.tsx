import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	Briefcase,
	Building2,
	Calendar,
	Check,
	CheckCircle2,
	Clock,
	GraduationCap,
	Loader2,
	Lock,
	Share2,
	Sparkles,
	Tag,
	User,
	Users,
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
import { type AuthUser, getCurrentUserFn } from "../server/authFns";
import { applyToGigFn, getGigFn, type SerializableGig } from "../server/gigFns";

export const Route = createFileRoute("/gigs/$gigId")({
	loader: async ({ params }) => {
		const [gig, user] = await Promise.all([
			getGigFn({ data: { gigId: params.gigId } }),
			getCurrentUserFn(),
		]);
		return { gig, user };
	},
	component: GigDetailPage,
});

function formatLongDate(dateString: string): string {
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	} catch {
		return dateString;
	}
}

function formatRelativeTime(dateString: string): string {
	try {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMinutes < 1) return "Just now";
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays === 1) return "Yesterday";
		if (diffDays < 7) return `${diffDays}d ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	} catch {
		return "Recently";
	}
}

function GigNotFoundView() {
	return (
		<div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
			<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
				<Briefcase className="size-8 text-muted-foreground" />
			</div>
			<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				Gig Not Found
			</h1>
			<p className="mt-2 text-muted-foreground max-w-md">
				The gig you are looking for does not exist, has been removed, or the
				link might be broken.
			</p>
			<div className="mt-6 flex items-center gap-3">
				<Button asChild variant="default" className="gap-2">
					<Link to="/gigs">
						<ArrowLeft className="size-4" />
						Back to all gigs
					</Link>
				</Button>
			</div>
		</div>
	);
}

function GigDetailPage() {
	const { gig, user } = Route.useLoaderData();

	if (!gig) {
		return <GigNotFoundView />;
	}

	return <GigDetailContent gig={gig} user={user} />;
}

interface GigDetailContentProps {
	gig: SerializableGig;
	user: AuthUser | null;
}

function GigDetailContent({ gig, user }: GigDetailContentProps) {
	const router = useRouter();

	const [applicantsCount, setApplicantsCount] = useState<number>(
		gig.applicantsCount,
	);
	const [hasApplied, setHasApplied] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [copied, setCopied] = useState<boolean>(false);

	const isOpen = gig.status === "OPEN";
	const isOwner = Boolean(user && gig.postedBy && user.id === gig.postedBy);
	const formattedPaymentAmount = `$${gig.paymentAmount.toLocaleString()}`;
	const paymentLabel = gig.paymentType === "HOURLY" ? "/ hour" : "Fixed Price";

	const handleCopyLink = async () => {
		try {
			if (typeof window !== "undefined") {
				await navigator.clipboard.writeText(window.location.href);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}
		} catch (err) {
			console.error("Failed to copy link:", err);
		}
	};

	const handleApply = async () => {
		if (!user) {
			// Redirect non-logged in users to login with redirect back to this gig
			await router.navigate({
				to: "/login",
				search: {
					redirect: `/gigs/${gig.id}`,
				},
			});
			return;
		}

		if (!isOpen || hasApplied || isSubmitting) {
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const res = await applyToGigFn({
				data: { gigId: gig.id },
			});

			if (res.success) {
				setApplicantsCount(res.applicantsCount ?? applicantsCount + 1);
				setHasApplied(true);
				setSuccessMessage(
					res.message || "Your application was submitted successfully!",
				);
				await router.invalidate();
			}
		} catch (err) {
			const msg =
				err instanceof Error
					? err.message
					: "Failed to submit application. Please try again.";
			setErrorMessage(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-6xl mx-auto space-y-6">
				{/* Breadcrumb / Navigation */}
				<div className="flex items-center justify-between">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="gap-2 text-muted-foreground hover:text-foreground"
					>
						<Link to="/gigs">
							<ArrowLeft className="size-4" />
							<span>Back to all gigs</span>
						</Link>
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={handleCopyLink}
						className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
					>
						{copied ? (
							<>
								<Check className="size-3.5 text-emerald-500" />
								<span>Copied link</span>
							</>
						) : (
							<>
								<Share2 className="size-3.5" />
								<span>Share</span>
							</>
						)}
					</Button>
				</div>

				{/* Main Layout Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
					{/* Left / Main Content (2 Columns on lg) */}
					<div className="lg:col-span-2 space-y-6">
						{/* Header Card */}
						<Card className="border-border">
							<CardHeader className="space-y-4">
								<div className="flex items-center gap-2 flex-wrap justify-between">
									<div className="flex items-center gap-2">
										{isOpen ? (
											<Badge
												variant="outline"
												className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-3 py-1 text-xs"
											>
												<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block" />
												OPEN FOR APPLICATIONS
											</Badge>
										) : (
											<Badge
												variant="secondary"
												className="bg-muted text-muted-foreground font-medium px-3 py-1 text-xs"
											>
												CLOSED
											</Badge>
										)}

										{isOwner && (
											<Badge
												variant="outline"
												className="border-primary/30 bg-primary/10 text-primary font-medium px-2.5 py-0.5 text-xs"
											>
												Your Posting
											</Badge>
										)}
									</div>

									<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
										<Clock className="size-3.5" />
										<span>{formatRelativeTime(gig.createdAt)}</span>
									</div>
								</div>

								<div className="space-y-2">
									<CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
										{gig.title}
									</CardTitle>

									{/* Poster metadata bar */}
									<div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-muted-foreground">
										<div className="flex items-center gap-1.5 font-medium text-foreground">
											<User className="size-4 text-muted-foreground" />
											<span>{gig.postedByName || "Campus Member"}</span>
										</div>

										{gig.collegeName && (
											<>
												<span>•</span>
												<div className="flex items-center gap-1.5">
													<Building2 className="size-4 text-muted-foreground" />
													<span>{gig.collegeName}</span>
												</div>
											</>
										)}

										<span>•</span>
										<div className="flex items-center gap-1.5">
											<Calendar className="size-4 text-muted-foreground" />
											<span>Posted {formatLongDate(gig.createdAt)}</span>
										</div>
									</div>
								</div>
							</CardHeader>
						</Card>

						{/* Description Card */}
						<Card className="border-border">
							<CardHeader className="pb-3 border-b border-border/50">
								<CardTitle className="text-lg font-semibold flex items-center gap-2">
									<Briefcase className="size-4 text-primary" />
									<span>Gig Description</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-6">
								<div className="prose dark:prose-invert max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
									{gig.description}
								</div>
							</CardContent>
						</Card>

						{/* Skills & Requirements Card */}
						<Card className="border-border">
							<CardHeader className="pb-3 border-b border-border/50">
								<CardTitle className="text-lg font-semibold flex items-center gap-2">
									<Tag className="size-4 text-primary" />
									<span>Required Skills & Tags</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-6">
								{gig.skills && gig.skills.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{gig.skills.map((skill) => (
											<Badge
												key={skill}
												variant="secondary"
												className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
											>
												{skill}
											</Badge>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										No specific skills or prerequisites were specified by the
										poster.
									</p>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Right / Sidebar Column (1 Column on lg, Sticky) */}
					<div className="space-y-6 lg:sticky lg:top-8">
						{/* Payment Highlight Card */}
						<Card className="border-border overflow-hidden shadow-sm">
							<div className="h-1.5 bg-primary w-full" />
							<CardHeader className="pb-4">
								<CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
									Compensation
								</CardDescription>
								<div className="flex items-baseline gap-2 pt-1">
									<span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
										{formattedPaymentAmount}
									</span>
									<span className="text-sm font-medium text-muted-foreground">
										{paymentLabel}
									</span>
								</div>
							</CardHeader>

							<CardContent className="space-y-4 pt-0">
								<div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3 text-xs text-muted-foreground">
									<Users className="size-4 text-primary shrink-0" />
									<div>
										<span className="font-semibold text-foreground">
											{applicantsCount}
										</span>{" "}
										{applicantsCount === 1 ? "student has" : "students have"}{" "}
										applied so far
									</div>
								</div>

								{/* Success Banner */}
								{successMessage && (
									<div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2.5">
										<CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
										<div className="space-y-1">
											<p className="font-semibold">Application Submitted!</p>
											<p className="leading-relaxed">{successMessage}</p>
										</div>
									</div>
								)}

								{/* Error Banner */}
								{errorMessage && (
									<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
										<AlertCircle className="size-4 shrink-0 mt-0.5" />
										<div className="space-y-1">
											<p className="font-semibold">Unable to Apply</p>
											<p className="leading-relaxed">{errorMessage}</p>
										</div>
									</div>
								)}

								{/* Application Actions */}
								{!isOpen ? (
									<div className="space-y-2">
										<Button
											disabled
											variant="secondary"
											className="w-full gap-2 cursor-not-allowed opacity-75"
										>
											<Lock className="size-4" />
											Gig is closed
										</Button>
										<p className="text-[11px] text-center text-muted-foreground">
											This posting is no longer accepting new applications.
										</p>
									</div>
								) : hasApplied ? (
									<div className="space-y-2">
										<Button
											disabled
											variant="outline"
											className="w-full gap-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 cursor-default"
										>
											<CheckCircle2 className="size-4" />
											Application Submitted
										</Button>
										<p className="text-[11px] text-center text-muted-foreground">
											You have applied to this gig! The poster will review your
											profile.
										</p>
									</div>
								) : !user ? (
									<div className="space-y-3">
										<Button asChild className="w-full gap-2 shadow-xs">
											<Link
												to="/login"
												search={{
													redirect: `/gigs/${gig.id}`,
												}}
											>
												<User className="size-4" />
												Log in to Apply
											</Link>
										</Button>
										<p className="text-[11px] text-center text-muted-foreground">
											You must be signed in with your campus account to apply.
										</p>
									</div>
								) : isOwner ? (
									<div className="space-y-2">
										<Button disabled variant="outline" className="w-full gap-2">
											<Briefcase className="size-4" />
											Your Own Posting
										</Button>
										<p className="text-[11px] text-center text-muted-foreground">
											You are the creator of this gig posting.
										</p>
									</div>
								) : (
									<div className="space-y-2">
										<Button
											onClick={handleApply}
											disabled={isSubmitting}
											className="w-full gap-2 shadow-sm font-semibold"
										>
											{isSubmitting ? (
												<>
													<Loader2 className="size-4 animate-spin" />
													Submitting Application...
												</>
											) : (
												<>
													<Sparkles className="size-4" />
													Apply for this Gig
												</>
											)}
										</Button>
										<p className="text-[11px] text-center text-muted-foreground">
											One-click instant application with your student profile.
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Poster Profile / College Info Card */}
						<Card className="border-border">
							<CardHeader className="pb-3">
								<CardTitle className="text-base font-semibold flex items-center gap-2">
									<GraduationCap className="size-4 text-primary" />
									<span>About the Poster</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base border border-primary/20">
										{(gig.postedByName || "U")[0].toUpperCase()}
									</div>
									<div className="space-y-0.5">
										<p className="text-sm font-semibold text-foreground">
											{gig.postedByName || "Campus Member"}
										</p>
										<p className="text-xs text-muted-foreground flex items-center gap-1">
											<Building2 className="size-3" />
											<span>{gig.collegeName || "Verified Campus"}</span>
										</p>
									</div>
								</div>

								<div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5 border border-border/50">
									<div className="flex items-center gap-1.5 font-medium text-foreground">
										<CheckCircle2 className="size-3.5 text-emerald-500" />
										<span>Campus-Verified Opportunity</span>
									</div>
									<p className="text-[11px] leading-relaxed">
										Posted by an authorized student or campus organization from{" "}
										<span className="font-medium text-foreground">
											{gig.collegeName || "the network"}
										</span>
										.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

export default GigDetailPage;
