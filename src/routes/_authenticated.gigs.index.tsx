import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { GigCard } from "../components/GigCard";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import { getCurrentUserFn } from "../server/authFns";
import { type GigSortOption, listGigsFn } from "../server/gigFns";

export interface GigSearchParams {
	q?: string;
	skills?: string[];
	minPayment?: number;
	maxPayment?: number;
	sort?: GigSortOption;
	page?: number;
}

const POPULAR_SKILLS = [
	"React",
	"Python",
	"Design",
	"Writing",
	"Math Tutoring",
	"Video Editing",
	"Node.js",
	"AI / ML",
	"Marketing",
	"Data Analysis",
];

const FIELD_CLASS =
	"rounded-md border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20";

export const Route = createFileRoute("/_authenticated/gigs/")({
	validateSearch: (search: Record<string, unknown>): GigSearchParams => {
		let skills: string[] | undefined;
		if (Array.isArray(search.skills)) {
			skills = search.skills.filter(
				(s): s is string => typeof s === "string" && s.trim().length > 0,
			);
		} else if (
			typeof search.skills === "string" &&
			search.skills.trim().length > 0
		) {
			skills = search.skills
				.split(",")
				.map((s) => s.trim())
				.filter((s) => s.length > 0);
		}

		let minPayment: number | undefined;
		if (
			typeof search.minPayment === "number" &&
			!Number.isNaN(search.minPayment)
		) {
			minPayment = search.minPayment;
		} else if (
			typeof search.minPayment === "string" &&
			search.minPayment.trim() !== ""
		) {
			const parsed = Number(search.minPayment);
			if (!Number.isNaN(parsed) && parsed >= 0) {
				minPayment = parsed;
			}
		}

		let maxPayment: number | undefined;
		if (
			typeof search.maxPayment === "number" &&
			!Number.isNaN(search.maxPayment)
		) {
			maxPayment = search.maxPayment;
		} else if (
			typeof search.maxPayment === "string" &&
			search.maxPayment.trim() !== ""
		) {
			const parsed = Number(search.maxPayment);
			if (!Number.isNaN(parsed) && parsed >= 0) {
				maxPayment = parsed;
			}
		}

		const validSorts: GigSortOption[] = [
			"newest",
			"payment-high",
			"payment-low",
			"applicants",
		];
		const sort: GigSortOption =
			typeof search.sort === "string" &&
			validSorts.includes(search.sort as GigSortOption)
				? (search.sort as GigSortOption)
				: "newest";

		const rawPage = Number(search.page);
		const page =
			!Number.isNaN(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

		return {
			q:
				typeof search.q === "string" && search.q.trim().length > 0
					? search.q.trim()
					: undefined,
			skills: skills && skills.length > 0 ? skills : undefined,
			minPayment:
				minPayment !== undefined && minPayment >= 0 ? minPayment : undefined,
			maxPayment:
				maxPayment !== undefined && maxPayment >= 0 ? maxPayment : undefined,
			sort,
			page,
		};
	},
	loaderDeps: ({ search }) => ({
		q: search.q,
		skills: search.skills,
		minPayment: search.minPayment,
		maxPayment: search.maxPayment,
		sort: search.sort,
		page: search.page,
	}),
	loader: async ({ deps }) => {
		const [gigsData, user] = await Promise.all([
			listGigsFn({
				data: {
					q: deps.q,
					skills: deps.skills,
					minPayment: deps.minPayment,
					maxPayment: deps.maxPayment,
					sort: deps.sort,
					page: deps.page,
					limit: 12,
				},
			}),
			getCurrentUserFn(),
		]);

		return {
			gigsData,
			user,
			searchParams: deps,
		};
	},
	component: BrowseGigsPage,
});

function BrowseGigsPage() {
	const { gigsData, user, searchParams } = Route.useLoaderData();
	const navigate = useNavigate();

	const isStudent = user?.role === "STUDENT";

	// Local state for debounced text inputs
	const [searchInput, setSearchInput] = useState<string>(searchParams.q || "");
	const [minPayInput, setMinPayInput] = useState<string>(
		searchParams.minPayment !== undefined
			? String(searchParams.minPayment)
			: "",
	);
	const [maxPayInput, setMaxPayInput] = useState<string>(
		searchParams.maxPayment !== undefined
			? String(searchParams.maxPayment)
			: "",
	);
	const [customSkillInput, setCustomSkillInput] = useState<string>("");

	// Synchronize local input state with searchParams on external updates
	useEffect(() => {
		setSearchInput(searchParams.q || "");
	}, [searchParams.q]);

	useEffect(() => {
		setMinPayInput(
			searchParams.minPayment !== undefined
				? String(searchParams.minPayment)
				: "",
		);
	}, [searchParams.minPayment]);

	useEffect(() => {
		setMaxPayInput(
			searchParams.maxPayment !== undefined
				? String(searchParams.maxPayment)
				: "",
		);
	}, [searchParams.maxPayment]);

	// Debounce search query update
	useEffect(() => {
		const timer = setTimeout(() => {
			const trimmed = searchInput.trim();
			const currentQ = searchParams.q?.trim() || "";
			if (trimmed !== currentQ) {
				navigate({
					to: "/gigs",
					search: (prev) => ({
						...prev,
						q: trimmed || undefined,
						page: 1,
					}),
				});
			}
		}, 350);

		return () => clearTimeout(timer);
	}, [searchInput, searchParams.q, navigate]);

	// Debounce payment range updates
	useEffect(() => {
		const timer = setTimeout(() => {
			const parsedMin =
				minPayInput.trim() !== "" && !Number.isNaN(Number(minPayInput))
					? Math.max(0, Number(minPayInput))
					: undefined;
			const parsedMax =
				maxPayInput.trim() !== "" && !Number.isNaN(Number(maxPayInput))
					? Math.max(0, Number(maxPayInput))
					: undefined;

			if (
				parsedMin !== searchParams.minPayment ||
				parsedMax !== searchParams.maxPayment
			) {
				navigate({
					to: "/gigs",
					search: (prev) => ({
						...prev,
						minPayment: parsedMin,
						maxPayment: parsedMax,
						page: 1,
					}),
				});
			}
		}, 400);

		return () => clearTimeout(timer);
	}, [
		minPayInput,
		maxPayInput,
		searchParams.minPayment,
		searchParams.maxPayment,
		navigate,
	]);

	const selectedSkills = searchParams.skills || [];

	const handleToggleSkill = (skill: string) => {
		const lowerSkill = skill.toLowerCase();
		const exists = selectedSkills.some((s) => s.toLowerCase() === lowerSkill);
		const updatedSkills = exists
			? selectedSkills.filter((s) => s.toLowerCase() !== lowerSkill)
			: [...selectedSkills, skill];

		navigate({
			to: "/gigs",
			search: (prev) => ({
				...prev,
				skills: updatedSkills.length > 0 ? updatedSkills : undefined,
				page: 1,
			}),
		});
	};

	const handleAddCustomSkill = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = customSkillInput.trim();
		if (!trimmed) {
			return;
		}

		if (
			!selectedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())
		) {
			navigate({
				to: "/gigs",
				search: (prev) => ({
					...prev,
					skills: [...selectedSkills, trimmed],
					page: 1,
				}),
			});
		}
		setCustomSkillInput("");
	};

	const handleSortChange = (newSort: string) => {
		navigate({
			to: "/gigs",
			search: (prev) => ({
				...prev,
				sort: newSort as GigSortOption,
				page: 1,
			}),
		});
	};

	const handleClearFilters = () => {
		setSearchInput("");
		setMinPayInput("");
		setMaxPayInput("");
		setCustomSkillInput("");
		navigate({
			to: "/gigs",
			search: {
				sort: "newest",
				page: 1,
			},
		});
	};

	const hasActiveFilters = Boolean(
		(searchParams.q && searchParams.q.length > 0) ||
			(searchParams.skills && searchParams.skills.length > 0) ||
			searchParams.minPayment !== undefined ||
			searchParams.maxPayment !== undefined ||
			(searchParams.sort && searchParams.sort !== "newest"),
	);

	const limit = gigsData.limit || 12;
	const totalPages = Math.max(1, Math.ceil(gigsData.total / limit));
	const currentPage = searchParams.page || 1;

	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
			return;
		}
		navigate({
			to: "/gigs",
			search: (prev) => ({
				...prev,
				page: newPage,
			}),
		});
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div className="w-full bg-background text-foreground">
			<div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16 space-y-10">
				{/* Page header */}
				<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-border">
					<div className="space-y-3">
						<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
							Browse {"//"} Gigs
						</span>
						<h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
							Open campus gigs
						</h1>
						<p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
							Flexible, paid projects posted by departments, research labs, and
							student teams across campus.
						</p>
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
						{user && !isStudent && (
							<span className="text-xs text-muted-foreground">
								Only verified students can post gigs
							</span>
						)}
						<Link
							to="/gigs/new"
							className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
						>
							Post a gig
						</Link>
					</div>
				</div>

				{/* Search & Filters */}
				<section
					aria-label="Search and filter gigs"
					className="border border-border bg-card rounded-lg p-6 sm:p-8 space-y-5"
				>
					<div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
						{/* Keyword Search */}
						<div className="relative md:col-span-7">
							<Search
								aria-hidden="true"
								className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
							/>
							<input
								type="text"
								aria-label="Search gigs by title or keyword"
								placeholder="Search gigs by title or keyword"
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								className={`${FIELD_CLASS} w-full pl-9 pr-16 py-2`}
							/>
							{searchInput && (
								<button
									type="button"
									onClick={() => setSearchInput("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
								>
									Clear
								</button>
							)}
						</div>

						{/* Payment Range */}
						<div className="md:col-span-3 flex items-center gap-2">
							<input
								type="number"
								min="0"
								aria-label="Minimum payment"
								placeholder="Min $"
								value={minPayInput}
								onChange={(e) => setMinPayInput(e.target.value)}
								className={`${FIELD_CLASS} w-full min-w-0 px-3 py-2`}
							/>
							<span className="text-xs text-muted-foreground shrink-0">to</span>
							<input
								type="number"
								min="0"
								aria-label="Maximum payment"
								placeholder="Max $"
								value={maxPayInput}
								onChange={(e) => setMaxPayInput(e.target.value)}
								className={`${FIELD_CLASS} w-full min-w-0 px-3 py-2`}
							/>
						</div>

						{/* Sort */}
						<div className="md:col-span-2">
							<Select
								value={searchParams.sort || "newest"}
								onValueChange={handleSortChange}
							>
								<SelectTrigger
									aria-label="Sort gigs"
									className="w-full h-9 rounded-md border border-border bg-transparent px-3 text-sm shadow-none focus-visible:border-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20"
								>
									<SelectValue placeholder="Sort by" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="newest">Newest first</SelectItem>
									<SelectItem value="payment-high">Highest pay</SelectItem>
									<SelectItem value="payment-low">Lowest pay</SelectItem>
									<SelectItem value="applicants">Most applicants</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Skill Filters */}
					<div className="space-y-3 pt-5 border-t border-border">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
								Skills
							</span>
							{hasActiveFilters && (
								<button
									type="button"
									onClick={handleClearFilters}
									className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
								>
									Clear filters
								</button>
							)}
						</div>

						<div className="flex flex-wrap items-center gap-2">
							{POPULAR_SKILLS.map((skill) => {
								const isSelected = selectedSkills.some(
									(s) => s.toLowerCase() === skill.toLowerCase(),
								);
								return (
									<button
										type="button"
										key={skill}
										aria-pressed={isSelected}
										onClick={() => handleToggleSkill(skill)}
										className={`rounded border px-2 py-0.5 text-xs transition-colors cursor-pointer ${
											isSelected
												? "border-foreground text-foreground"
												: "border-border text-muted-foreground hover:border-foreground/35 hover:text-foreground"
										}`}
									>
										{skill}
									</button>
								);
							})}

							{/* Custom Skill Input */}
							<form
								onSubmit={handleAddCustomSkill}
								className="flex items-center gap-2"
							>
								<input
									type="text"
									aria-label="Add a skill filter"
									placeholder="Add skill"
									value={customSkillInput}
									onChange={(e) => setCustomSkillInput(e.target.value)}
									className={`${FIELD_CLASS} w-32 px-2.5 py-1.5 text-xs`}
								/>
								{customSkillInput.trim() && (
									<button
										type="submit"
										className="rounded border border-border px-2.5 py-1.5 text-xs text-foreground transition-colors hover:border-foreground/35"
									>
										Add
									</button>
								)}
							</form>
						</div>

						{/* Active Custom Skills (if any are not in POPULAR_SKILLS) */}
						{selectedSkills.filter(
							(s) =>
								!POPULAR_SKILLS.some(
									(pop) => pop.toLowerCase() === s.toLowerCase(),
								),
						).length > 0 && (
							<div className="flex flex-wrap items-center gap-2 pt-1">
								<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mr-1">
									Custom
								</span>
								{selectedSkills
									.filter(
										(s) =>
											!POPULAR_SKILLS.some(
												(pop) => pop.toLowerCase() === s.toLowerCase(),
											),
									)
									.map((skill) => (
										<span
											key={skill}
											className="inline-flex items-center gap-1.5 rounded border border-foreground px-2 py-0.5 text-xs text-foreground"
										>
											<span>{skill}</span>
											<button
												type="button"
												onClick={() => handleToggleSkill(skill)}
												className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
											>
												<span aria-hidden="true">&times;</span>
												<span className="sr-only">Remove {skill}</span>
											</button>
										</span>
									))}
							</div>
						)}
					</div>
				</section>

				{/* Result Count and Status Header */}
				<div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
					<span className="font-mono text-[11px] uppercase tracking-wider">
						{gigsData.total} {gigsData.total === 1 ? "gig" : "gigs"} available
						{hasActiveFilters && " (filtered)"}
					</span>

					{totalPages > 1 && (
						<span className="font-mono text-[11px] uppercase tracking-wider">
							Page {currentPage} of {totalPages}
						</span>
					)}
				</div>

				{/* Gig Cards Grid or Empty State */}
				{gigsData.items.length === 0 ? (
					<EmptyState
						hasActiveFilters={hasActiveFilters}
						onClearFilters={handleClearFilters}
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{gigsData.items.map((gig) => (
							<GigCard key={gig.id} gig={gig} />
						))}
					</div>
				)}

				{/* Pagination Controls */}
				{totalPages > 1 && (
					<div className="flex flex-wrap items-center justify-center gap-2 pt-2 pb-4">
						<button
							type="button"
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage <= 1}
							className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-foreground/35 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Previous
						</button>

						<div className="flex items-center gap-1 px-2">
							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter((p) => {
									// Show current, first, last, and immediate siblings
									return (
										p === 1 ||
										p === totalPages ||
										Math.abs(p - currentPage) <= 1
									);
								})
								.map((pageNumber, idx, arr) => {
									const prev = arr[idx - 1];
									const showEllipsis = prev && pageNumber - prev > 1;

									return (
										<div key={pageNumber} className="flex items-center">
											{showEllipsis && (
												<span className="px-2 text-muted-foreground text-xs">
													...
												</span>
											)}
											<button
												type="button"
												onClick={() => handlePageChange(pageNumber)}
												className={`h-9 w-9 rounded-md border text-xs font-medium transition-colors ${
													currentPage === pageNumber
														? "border-foreground text-foreground"
														: "border-border text-muted-foreground hover:border-foreground/35 hover:text-foreground"
												}`}
											>
												{pageNumber}
											</button>
										</div>
									);
								})}
						</div>

						<button
							type="button"
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage >= totalPages}
							className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-foreground/35 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Next
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

function EmptyState({
	hasActiveFilters,
	onClearFilters,
}: {
	hasActiveFilters: boolean;
	onClearFilters: () => void;
}) {
	return (
		<section className="border border-border bg-card rounded-lg p-8 sm:p-12 my-2">
			<div className="max-w-md mx-auto text-center space-y-3">
				<h2 className="text-lg font-semibold tracking-tight text-foreground">
					{hasActiveFilters
						? "No gigs match those filters"
						: "No gigs posted yet"}
				</h2>
				<p className="text-sm text-muted-foreground leading-relaxed">
					{hasActiveFilters
						? "Try a different keyword, widen the payment range, or clear your filters."
						: "New opportunities from campus departments and labs will appear here."}
				</p>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
					{hasActiveFilters && (
						<button
							type="button"
							onClick={onClearFilters}
							className="text-sm text-foreground underline-offset-4 hover:underline"
						>
							Clear filters
						</button>
					)}

					<Link
						to="/gigs/new"
						className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/35"
					>
						Post the first gig
					</Link>
				</div>
			</div>
		</section>
	);
}
