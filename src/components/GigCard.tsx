import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import {
	ArrowRight,
	Building2,
	Clock,
	DollarSign,
	User,
	Users,
} from "lucide-react";
import type { SerializableGig } from "../server/gigFns";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";

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
			? `$${gig.paymentAmount.toLocaleString()}/hr`
			: `$${gig.paymentAmount.toLocaleString()} Fixed`;

	return (
		<Card
			className={cn(
				"group flex flex-col justify-between overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md",
				className,
			)}
		>
			<CardHeader className="space-y-3 pb-3">
				{/* Top meta row: Status & Payment badges */}
				<div className="flex items-center justify-between gap-2 flex-wrap">
					{isOpen ? (
						<Badge
							variant="outline"
							className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-0.5 text-xs"
						>
							<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block" />
							OPEN
						</Badge>
					) : (
						<Badge
							variant="secondary"
							className="bg-muted text-muted-foreground font-medium px-2.5 py-0.5 text-xs"
						>
							CLOSED
						</Badge>
					)}

					<Badge
						variant="outline"
						className="border-primary/30 bg-primary/10 text-primary font-semibold px-2.5 py-0.5 text-xs gap-1"
					>
						<DollarSign className="size-3 text-primary shrink-0" />
						<span>{formattedPayment}</span>
					</Badge>
				</div>

				{/* Title */}
				<div className="space-y-1">
					<CardTitle className="text-lg font-semibold tracking-tight leading-snug">
						<Link
							to="/gigs/$gigId"
							params={{ gigId: gig.id }}
							className="hover:text-primary transition-colors line-clamp-2"
						>
							{gig.title}
						</Link>
					</CardTitle>

					{/* Poster & College info */}
					<div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
						<div className="flex items-center gap-1 font-medium text-foreground">
							<User className="size-3.5 text-muted-foreground" />
							<span>{gig.postedByName || "Campus Member"}</span>
						</div>

						{gig.collegeName && (
							<Badge
								variant="outline"
								className="text-[11px] font-normal bg-muted/60 text-muted-foreground border-border/80 gap-1 px-2 py-0"
							>
								<Building2 className="size-3 shrink-0" />
								<span className="line-clamp-1">{gig.collegeName}</span>
							</Badge>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4 flex-1">
				{/* Description snippet */}
				<p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
					{gig.description}
				</p>

				{/* Skills tags */}
				{gig.skills && gig.skills.length > 0 && (
					<div className="flex flex-wrap gap-1.5 pt-1">
						{gig.skills.slice(0, 4).map((skill) => (
							<Badge
								key={skill}
								variant="secondary"
								className="text-[11px] font-normal px-2 py-0.5 bg-secondary text-secondary-foreground"
							>
								{skill}
							</Badge>
						))}
						{gig.skills.length > 4 && (
							<Badge
								variant="secondary"
								className="text-[11px] font-normal px-2 py-0.5 bg-muted text-muted-foreground"
							>
								+{gig.skills.length - 4} more
							</Badge>
						)}
					</div>
				)}
			</CardContent>

			<CardFooter className="flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
				{/* Applicants count & posted time */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1 font-medium text-foreground">
						<Users className="size-3.5 text-muted-foreground" />
						<span>
							{gig.applicantsCount}{" "}
							{gig.applicantsCount === 1 ? "applicant" : "applicants"}
						</span>
					</div>
					<span>•</span>
					<div className="flex items-center gap-1">
						<Clock className="size-3.5" />
						<span>{formatRelativeTime(gig.createdAt)}</span>
					</div>
				</div>

				{/* "View Details" button / arrow link */}
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="h-8 gap-1 px-2.5 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 group-hover:translate-x-0.5 transition-all"
				>
					<Link to="/gigs/$gigId" params={{ gigId: gig.id }}>
						<span>View Details</span>
						<ArrowRight className="size-3.5" />
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

export default GigCard;
