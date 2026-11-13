import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import type { SerializableGig } from "../server/gigFns";

export interface GigCardProps {
	gig: SerializableGig;
	className?: string;
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

export function GigCard({ gig, className }: GigCardProps) {
	const isOpen = gig.status === "OPEN";
	const formattedPayment =
		gig.paymentType === "HOURLY"
			? `$${gig.paymentAmount.toLocaleString()} / hr`
			: `$${gig.paymentAmount.toLocaleString()} fixed`;

	return (
		<article
			className={cn(
				"flex flex-col justify-between rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/35",
				className,
			)}
		>
			<div>
				{/* Meta row: college & status */}
				<div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
					{gig.collegeName ? (
						<span className="line-clamp-1">{gig.collegeName}</span>
					) : (
						<span>Independent posting</span>
					)}
					<span className={cn("shrink-0", isOpen && "text-foreground")}>
						{isOpen ? "Open" : "Closed"}
					</span>
				</div>

				{/* Title */}
				<h2 className="mt-3 text-base font-semibold tracking-tight leading-snug text-foreground">
					<Link
						to="/gigs/$gigId"
						params={{ gigId: gig.id }}
						className="line-clamp-2 underline-offset-4 hover:underline"
					>
						{gig.title}
					</Link>
				</h2>

				{/* Description snippet */}
				<p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
					{gig.description}
				</p>

				{/* Skills */}
				{gig.skills && gig.skills.length > 0 && (
					<div className="mt-4 flex flex-wrap gap-1.5">
						{gig.skills.slice(0, 4).map((skill) => (
							<span
								key={skill}
								className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground"
							>
								{skill}
							</span>
						))}
						{gig.skills.length > 4 && (
							<span className="px-1 py-0.5 text-xs text-muted-foreground">
								+{gig.skills.length - 4} more
							</span>
						)}
					</div>
				)}
			</div>

			{/* Footer: payment, applicants, poster & link */}
			<div className="mt-6 border-t border-border pt-4">
				<div className="flex flex-wrap items-baseline justify-between gap-2">
					<span className="text-sm font-semibold text-foreground">
						{formattedPayment}
					</span>
					<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
						{gig.applicantsCount}{" "}
						{gig.applicantsCount === 1 ? "applicant" : "applicants"}
					</span>
				</div>

				<div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
					<span className="line-clamp-1">
						{gig.postedByName || "Campus member"} &middot;{" "}
						{formatRelativeTime(gig.createdAt)}
					</span>
					<Link
						to="/gigs/$gigId"
						params={{ gigId: gig.id }}
						className="shrink-0 font-medium text-foreground underline-offset-4 hover:underline"
					>
						View details &rarr;
					</Link>
				</div>
			</div>
		</article>
	);
}

export default GigCard;
