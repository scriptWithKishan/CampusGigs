import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { type AuthUser, getCurrentUserFn } from "../../../server/authFns";
import {
	applyToGigFn,
	getGigFn,
	type SerializableGig,
} from "../../../server/gigFns";

export const Route = createFileRoute("/_authenticated/gigs/$gigId")({
	loader: async ({ params }) => {
		const [gig, user] = await Promise.all([
			getGigFn({ data: { gigId: params.gigId } }),
			getCurrentUserFn(),
		]);
		return { gig, user };
	},
	component: GigDetailPage,
});

const metaLabelClass =
	"font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

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

function GigNotFoundView() {
	return (
		<div className="w-full px-6 sm:px-10 lg:px-16 max-w-[1400px] mx-auto py-16 sm:py-24">
			<span className={metaLabelClass}>Not found</span>
			<h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
				Gig not found
			</h1>
			<p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
				The gig you are looking for does not exist, has been removed, or the
				link might be broken.
			</p>
			<Link
				to="/"
				hash="gigs"
				className="mt-8 inline-block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				&larr; Back to all gigs
			</Link>
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
	const paymentLabel = gig.paymentType === "HOURLY" ? "per hour" : "fixed";

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
		<div className="w-full px-6 sm:px-10 lg:px-16 max-w-[1400px] mx-auto py-10 sm:py-14">
			{/* Breadcrumb / Share */}
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6">
				<Link
					to="/"
					hash="gigs"
					className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					&larr; Back to gigs
				</Link>

				<button
					type="button"
					onClick={handleCopyLink}
					className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					{copied ? "Link copied" : "Copy link"}
				</button>
			</div>

			{/* Editorial header */}
			<header className="mt-10 border-b border-border pb-10">
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
					<span className="text-sm font-medium text-foreground">
						{isOpen ? "Open" : "Closed"}
					</span>
					{isOwner && <span className={metaLabelClass}>Your posting</span>}
				</div>

				<h1 className="mt-4 max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
					{gig.title}
				</h1>

				<div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
					{gig.collegeName && (
						<>
							<span>{gig.collegeName}</span>
							<span aria-hidden="true">&bull;</span>
						</>
					)}
					<span>Posted {formatLongDate(gig.createdAt)}</span>
					<span aria-hidden="true">&bull;</span>
					<span>
						{formattedPaymentAmount} {paymentLabel}
					</span>
				</div>
			</header>

			<div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
				{/* Main content */}
				<div className="lg:col-span-8 space-y-10">
					<section>
						<span className={metaLabelClass}>Description</span>
						<div className="mt-4 whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-foreground/90">
							{gig.description}
						</div>
					</section>

					<section className="border-t border-border pt-8">
						<span className={metaLabelClass}>Required skills</span>
						{gig.skills && gig.skills.length > 0 ? (
							<div className="mt-4 flex flex-wrap gap-1.5">
								{gig.skills.map((skill) => (
									<span
										key={skill}
										className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground"
									>
										{skill}
									</span>
								))}
							</div>
						) : (
							<p className="mt-4 text-sm text-muted-foreground">
								No specific skills or prerequisites were specified by the
								poster.
							</p>
						)}
					</section>
				</div>

				{/* Sidebar */}
				<aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
					<div className="space-y-6 rounded-lg border border-border bg-card p-6">
						<div>
							<span className={metaLabelClass}>Compensation</span>
							<p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
								{formattedPaymentAmount}
								<span className="ml-2 text-sm font-normal text-muted-foreground">
									{paymentLabel}
								</span>
							</p>
						</div>

						<div className="border-t border-border pt-4">
							<span className={metaLabelClass}>Applicants</span>
							<p className="mt-1 text-sm text-muted-foreground">
								{applicantsCount}{" "}
								{applicantsCount === 1 ? "student has" : "students have"}{" "}
								applied
							</p>
						</div>

						{/* Success Banner */}
						{successMessage && (
							<div className="rounded-md border border-border px-3.5 py-3 text-xs text-muted-foreground">
								<p className="font-medium text-foreground">
									Application submitted
								</p>
								<p className="mt-1 leading-relaxed">{successMessage}</p>
							</div>
						)}

						{/* Error Banner */}
						{errorMessage && (
							<div
								role="alert"
								className="rounded-md border border-destructive/40 px-3.5 py-3 text-xs text-destructive"
							>
								<p className="font-medium">Unable to apply</p>
								<p className="mt-1 leading-relaxed">{errorMessage}</p>
							</div>
						)}

						{/* Application Actions */}
						<div className="border-t border-border pt-6">
							{!isOpen ? (
								<div className="space-y-2">
									<div className="rounded-md border border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground">
										Closed
									</div>
									<p className="text-xs text-muted-foreground leading-relaxed">
										This posting is no longer accepting new applications.
									</p>
								</div>
							) : hasApplied ? (
								<div className="space-y-2">
									<div className="rounded-md border border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground">
										Application submitted
									</div>
									<p className="text-xs text-muted-foreground leading-relaxed">
										The poster will review your profile.
									</p>
								</div>
							) : !user ? (
								<div className="space-y-2">
									<Link
										to="/login"
										search={{
											redirect: `/gigs/${gig.id}`,
										}}
										className="flex w-full items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
									>
										Log in to apply
									</Link>
									<p className="text-xs text-muted-foreground leading-relaxed">
										You must be signed in with your campus account to apply.
									</p>
								</div>
							) : isOwner ? (
								<div className="space-y-2">
									<div className="rounded-md border border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground">
										Your own posting
									</div>
									<p className="text-xs text-muted-foreground leading-relaxed">
										You are the creator of this gig posting.
									</p>
								</div>
							) : (
								<div className="space-y-2">
									<button
										type="button"
										onClick={handleApply}
										disabled={isSubmitting}
										className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{isSubmitting ? "Submitting..." : "Apply for this gig"}
									</button>
									<p className="text-xs text-muted-foreground leading-relaxed">
										One-click application with your student profile.
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Poster info */}
					<div className="rounded-lg border border-border bg-card p-6">
						<span className={metaLabelClass}>Posted by</span>
						<p className="mt-3 text-sm font-medium text-foreground">
							{gig.postedByName || "Campus member"}
						</p>
						<p className="mt-0.5 text-sm text-muted-foreground">
							{gig.collegeName || "Verified campus"}
						</p>
						<p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground leading-relaxed">
							Campus-verified opportunity posted by an authorized student or
							campus organization.
						</p>
					</div>
				</aside>
			</div>
		</div>
	);
}

export default GigDetailPage;
