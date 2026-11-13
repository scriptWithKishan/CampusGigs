import { createFileRoute, Link } from "@tanstack/react-router";
import { getCurrentUserFn } from "../server/authFns";
import { listGigsFn, type SerializableGig } from "../server/gigFns";

export const Route = createFileRoute("/")({
	loader: async () => {
		const [user, gigResult] = await Promise.all([
			getCurrentUserFn(),
			listGigsFn({ data: { limit: 6, sort: "newest" } }).catch(() => null),
		]);
		return { user, gigs: gigResult?.items ?? [] };
	},
	component: HomePage,
});

// Fallback gig data, shown only when the marketplace has no open gigs yet.
interface SampleGig {
	id: string;
	title: string;
	department: string;
	description: string;
	compensation: string;
	skills: string[];
	applicantCount: number;
}

const SAMPLE_GIGS: SampleGig[] = [
	{
		id: "gig-1",
		title: "Genomics Data Pipeline Automation",
		department: "Biology Department",
		description:
			"Build automated scripts to clean high-throughput sequencing CSVs and generate report summaries.",
		compensation: "$600 fixed",
		skills: ["Python", "Pandas", "Data Analysis"],
		applicantCount: 4,
	},
	{
		id: "gig-2",
		title: "Campus Shuttle App UX Prototype",
		department: "Student Transportation",
		description:
			"Design interactive mobile flows and wireframes for on-demand evening transit scheduling.",
		compensation: "$32 / hr",
		skills: ["Figma", "UI/UX", "Prototyping"],
		applicantCount: 7,
	},
	{
		id: "gig-3",
		title: "Robotics Lab Portal & Inventory",
		department: "Autonomous Systems Lab",
		description:
			"Develop a modern web interface for tracking lab parts, equipment checkout, and member access.",
		compensation: "$850 fixed",
		skills: ["TypeScript", "Tailwind CSS", "React"],
		applicantCount: 5,
	},
	{
		id: "gig-4",
		title: "Econometrics Paper Typesetting",
		department: "Department of Economics",
		description:
			"Format empirical working papers, mathematical proofs, and regression tables in journal-ready LaTeX.",
		compensation: "$28 / hr",
		skills: ["LaTeX", "BibTeX", "Copyediting"],
		applicantCount: 2,
	},
	{
		id: "gig-5",
		title: "Undergraduate Film Festival Identity",
		department: "School of Visual Arts",
		description:
			"Create promotional posters, digital festival schedules, and printed screening booklets.",
		compensation: "$550 fixed",
		skills: ["Print Design", "Typography", "Illustrator"],
		applicantCount: 9,
	},
	{
		id: "gig-6",
		title: "Archive Newspaper OCR Correction",
		department: "University Special Collections",
		description:
			"Audit and fine-tune OCR transcripts from digitized mid-century campus periodicals.",
		compensation: "$24 / hr",
		skills: ["Python", "OCR", "Digital Humanities"],
		applicantCount: 3,
	},
];

function formatGigPayment(gig: SerializableGig): string {
	const amount = `$${gig.paymentAmount.toLocaleString("en-US")}`;
	return gig.paymentType === "HOURLY" ? `${amount} / hr` : `${amount} fixed`;
}

function HomePage() {
	const { user, gigs } = Route.useLoaderData();

	const hasRealGigs = gigs.length > 0;
	const visibleGigs = hasRealGigs ? gigs.slice(0, 6) : null;

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

					{/* Right Column: Restrained Typographic Art Composition */}
					<div className="lg:col-span-5">
						<div className="border border-border rounded-lg bg-card/60 p-6 sm:p-8 flex flex-col justify-between space-y-8">
							<div className="flex items-center justify-between border-b border-border pb-4">
								<span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
									Directory {"//"} Index 01
								</span>
								<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
									<span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
									Active Network
								</span>
							</div>

							<div className="space-y-6">
								<div className="space-y-1.5">
									<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
										01 &mdash; Disciplines
									</span>
									<p className="text-sm text-foreground font-medium leading-snug">
										Software Systems &bull; Product Design &bull; Empirical
										Research &bull; Academic Editorial
									</p>
								</div>

								<div className="border-t border-border pt-4 space-y-1.5">
									<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
										02 &mdash; Verified Credentials
									</span>
									<p className="text-sm text-muted-foreground leading-relaxed">
										Strict affiliation verification via university-issued domain
										emails for students and administrative sponsors.
									</p>
								</div>

								<div className="border-t border-border pt-4 space-y-1.5">
									<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
										03 &mdash; Escrow Settlement
									</span>
									<p className="text-sm text-muted-foreground leading-relaxed">
										Milestone disbursements released upon accepted departmental
										deliverables. Zero external recruitment friction.
									</p>
								</div>
							</div>

							<div className="pt-4 border-t border-border flex items-center justify-between font-mono text-[11px] text-muted-foreground">
								<span>CampusGigs Registry</span>
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
						</div>

						<Link
							to="/gigs"
							className="text-sm font-medium text-foreground hover:text-primary transition-colors shrink-0"
						>
							Browse all gigs &rarr;
						</Link>
					</div>

					{/* Responsive Grid of Gig Cards — real listings, with a sample fallback */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{visibleGigs
							? visibleGigs.map((gig) => (
									<Link
										key={gig.id}
										to="/gigs/$gigId"
										params={{ gigId: gig.id }}
										className="border border-border bg-card rounded-lg p-6 flex flex-col justify-between hover:border-foreground/35 transition-colors"
									>
										<div>
											<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
												{gig.collegeName}
											</span>
											<h3 className="mt-2 text-base font-semibold tracking-tight text-foreground">
												{gig.title}
											</h3>
											<p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
												{gig.description}
											</p>
										</div>

										<div className="mt-6 pt-4 border-t border-border space-y-3">
											<div className="flex flex-wrap gap-1.5">
												{gig.skills.slice(0, 3).map((skill) => (
													<span
														key={skill}
														className="px-2 py-0.5 text-xs rounded border border-border text-muted-foreground bg-secondary/50 font-medium"
													>
														{skill}
													</span>
												))}
											</div>

											<div className="flex items-center justify-between text-xs pt-1">
												<span className="font-semibold text-foreground">
													{formatGigPayment(gig)}
												</span>
												<span className="text-muted-foreground">
													{gig.applicantsCount} applicants
												</span>
											</div>
										</div>
									</Link>
								))
							: SAMPLE_GIGS.map((gig) => (
									<div
										key={gig.id}
										className="border border-border bg-card rounded-lg p-6 flex flex-col justify-between hover:border-foreground/35 transition-colors"
									>
										<div>
											<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
												{gig.department}
											</span>
											<h3 className="mt-2 text-base font-semibold tracking-tight text-foreground">
												{gig.title}
											</h3>
											<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
												{gig.description}
											</p>
										</div>

										<div className="mt-6 pt-4 border-t border-border space-y-3">
											<div className="flex flex-wrap gap-1.5">
												{gig.skills.map((skill) => (
													<span
														key={skill}
														className="px-2 py-0.5 text-xs rounded border border-border text-muted-foreground bg-secondary/50 font-medium"
													>
														{skill}
													</span>
												))}
											</div>

											<div className="flex items-center justify-between text-xs pt-1">
												<span className="font-semibold text-foreground">
													{gig.compensation}
												</span>
												<span className="text-muted-foreground">
													{gig.applicantCount} applicants
												</span>
											</div>
										</div>
									</div>
								))}
					</div>
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
