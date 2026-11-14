import { createFileRoute, Link } from "@tanstack/react-router";
import { GigExplorer } from "../components/GigExplorer";
import { type GigSearchParams, validateGigSearch } from "../lib/gigSearch";
import { getCurrentUserFn } from "../server/authFns";
import { type ListGigsResult, listGigsFn } from "../server/gigFns";

export const Route = createFileRoute("/")({
	validateSearch: validateGigSearch,
	loaderDeps: ({ search }) => ({
		q: search.q,
		skills: search.skills,
		minPayment: search.minPayment,
		maxPayment: search.maxPayment,
		sort: search.sort,
		page: search.page,
	}),
	loader: async ({ deps }) => {
		const [user, gigsData] = await Promise.all([
			getCurrentUserFn(),
			listGigsFn({ data: { ...deps, limit: 9 } }).catch(
				(): ListGigsResult => ({ items: [], total: 0, page: 1, limit: 9 }),
			),
		]);
		return { user, gigsData, searchParams: deps as GigSearchParams };
	},
	component: HomePage,
});

const STUDENT_FEATURES = [
	{
		number: "01",
		label: "Discover paid campus work",
		description:
			"Projects from departments, research labs and student ventures, calibrated to the academic term.",
	},
	{
		number: "02",
		label: "Filter by skills & pay",
		description:
			"Search titles, stack by skill, set a pay range, and sort by newest or highest paying.",
	},
	{
		number: "03",
		label: "Apply with a verified profile",
		description:
			"University-domain verification means every posting and applicant is a real campus member.",
	},
	{
		number: "04",
		label: "Track everything in one dashboard",
		description:
			"Open listings, applications and posted gigs in a single view.",
	},
];

function HomePage() {
	const { user, gigsData, searchParams } = Route.useLoaderData();

	return (
		<div className="w-full bg-background text-foreground">
			<div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16 lg:py-24 space-y-24 lg:space-y-32">
				{/* Hero Section — 2 Columns on Desktop */}
				<section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
					{/* Left Column: Headline, Narrative, and Actions */}
					<div className="lg:col-span-7 flex flex-col justify-center">
						<h1 className="text-[44px] sm:text-[62px] lg:text-[76px] leading-[1.04] font-bold tracking-tight text-foreground">
							Campus talent,
							<br />
							hired directly.
						</h1>

						<p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
							Connect university students with campus departments, research
							labs, and student ventures for flexible, paid project work
							calibrated to the academic calendar.
						</p>

						<div className="mt-8 flex items-center gap-6">
							{user ? (
								<>
									<Link
										to="/dashboard"
										className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
									>
										Go to dashboard
									</Link>
									<a
										href="#gigs"
										className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
									>
										Browse open gigs &darr;
									</a>
								</>
							) : (
								<>
									<Link
										to="/signup"
										className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
									>
										Create account
									</Link>
									<a
										href="#gigs"
										className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
									>
										Browse open gigs &darr;
									</a>
								</>
							)}
						</div>
					</div>

					{/* Right Column: Student-Facing Feature Index */}
					<div className="lg:col-span-5">
						<div className="border border-border rounded-lg bg-card/60 p-6 sm:p-8 flex flex-col justify-between space-y-8">
							<div className="flex items-center justify-between border-b border-border pb-4">
								<span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
									Student {"//"} Features
								</span>
								<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
									<span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
									Listings Live
								</span>
							</div>

							<div className="space-y-6">
								{STUDENT_FEATURES.map((feature) => (
									<div
										key={feature.number}
										className="space-y-1.5 border-t border-border pt-4 first:border-t-0 first:pt-0"
									>
										<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
											{feature.number} &mdash; {feature.label}
										</span>
										<p className="text-sm text-muted-foreground leading-relaxed">
											{feature.description}
										</p>
									</div>
								))}
							</div>

							<div className="pt-4 border-t border-border flex items-center justify-between font-mono text-[11px] text-muted-foreground">
								<span>CampusGigs Student Registry</span>
								<span>Term 2026</span>
							</div>
						</div>
					</div>
				</section>

				{/* Gigs Section */}
				<section id="gigs" className="space-y-8 scroll-mt-24">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
						<div>
							<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
								Open campus gigs
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Flexible projects posted by departments, faculty, and student
								teams.
							</p>
							{user && user.role !== "STUDENT" && (
								<p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
									Only verified students can post gigs
								</p>
							)}
						</div>

						<Link
							to="/gigs/new"
							className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:border-foreground/35 transition-colors shrink-0"
						>
							Post a gig
						</Link>
					</div>

					<GigExplorer gigsData={gigsData} searchParams={searchParams} />
				</section>

				{/* Quiet Closing / Footer CTA */}
				<section className="pt-8 pb-12 border-t border-border">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
						<div className="max-w-xl">
							<h3 className="text-xl font-semibold tracking-tight text-foreground">
								Ready to take on campus projects?
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Join students, faculty, and campus organizers across your
								university today.
							</p>
						</div>

						<div className="flex items-center gap-4">
							{user ? (
								<Link
									to="/dashboard"
									className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
								>
									Go to dashboard
								</Link>
							) : (
								<>
									<Link
										to="/signup"
										className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
									>
										Create account
									</Link>
									<Link
										to="/login"
										className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2"
									>
										Log in
									</Link>
								</>
							)}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
