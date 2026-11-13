import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Briefcase,
	ChevronLeft,
	ChevronRight,
	DollarSign,
	Filter,
	Plus,
	RotateCcw,
	Search,
	Sparkles,
	Tag,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { GigCard } from "../components/GigCard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
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

export const Route = createFileRoute("/gigs/")({
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
					search: (prev: Record<string, unknown>) => ({
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
					search: (prev: Record<string, unknown>) => ({
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
			search: (prev: Record<string, unknown>) => ({
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
				search: (prev: Record<string, unknown>) => ({
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
			search: (prev: Record<string, unknown>) => ({
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
			search: (prev: Record<string, unknown>) => ({
				...prev,
				page: newPage,
			}),
		});
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div className="min-h-screen bg-background py-8 lg:py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
				{/* Header Section */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="text-xs px-2.5 py-0.5 gap-1 border-primary/30 text-primary bg-primary/5"
							>
								<Sparkles className="w-3 h-3 text-primary" />
								<span>Student Marketplace</span>
							</Badge>
						</div>
						<h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-serif">
							Campus Gigs
						</h1>
						<p className="text-sm sm:text-base text-muted-foreground">
							Discover freelance projects &amp; campus tasks
						</p>
					</div>

					<div className="flex items-center gap-3">
						{user && !isStudent && (
							<span className="hidden sm:inline text-xs text-muted-foreground">
								Only verified students can post gigs
							</span>
						)}
						<Button
							asChild
							size="lg"
							className="h-10 px-5 font-semibold gap-2 shadow-xs shadow-primary/25"
						>
							<Link to="/gigs/new">
								<Plus className="w-4 h-4" />
								<span>Post a Gig</span>
							</Link>
						</Button>
					</div>
				</div>

				{/* Filter & Search Bar */}
				<Card className="border-border bg-card shadow-xs">
					<CardContent className="p-4 sm:p-6 space-y-5">
						{/* Search Input and Sort Row */}
						<div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
							{/* Keyword Search */}
							<div className="relative md:col-span-7">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search gigs by title or keywords..."
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									className="pl-9 pr-8 h-10 text-sm bg-background/50"
								/>
								{searchInput && (
									<button
										type="button"
										onClick={() => setSearchInput("")}
										className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
									>
										<X className="w-4 h-4" />
										<span className="sr-only">Clear search input</span>
									</button>
								)}
							</div>

							{/* Payment Range */}
							<div className="md:col-span-3 flex items-center gap-2">
								<div className="relative flex-1">
									<DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
									<Input
										type="number"
										min="0"
										placeholder="Min $"
										value={minPayInput}
										onChange={(e) => setMinPayInput(e.target.value)}
										className="pl-7 h-10 text-xs sm:text-sm bg-background/50"
									/>
								</div>
								<span className="text-muted-foreground text-xs font-medium">
									to
								</span>
								<div className="relative flex-1">
									<DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
									<Input
										type="number"
										min="0"
										placeholder="Max $"
										value={maxPayInput}
										onChange={(e) => setMaxPayInput(e.target.value)}
										className="pl-7 h-10 text-xs sm:text-sm bg-background/50"
									/>
								</div>
							</div>

							{/* Sort Dropdown */}
							<div className="md:col-span-2">
								<Select
									value={searchParams.sort || "newest"}
									onValueChange={handleSortChange}
								>
									<SelectTrigger className="w-full h-10 text-xs sm:text-sm bg-background/50">
										<SelectValue placeholder="Sort order" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="newest">Newest First</SelectItem>
										<SelectItem value="payment-high">Highest Pay</SelectItem>
										<SelectItem value="payment-low">Lowest Pay</SelectItem>
										<SelectItem value="applicants">Most Applicants</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Popular Skills Quick-Chips */}
						<div className="space-y-2 pt-2 border-t border-border/50">
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
									<Filter className="w-3.5 h-3.5" />
									Filter by Popular Skills:
								</span>
								{hasActiveFilters && (
									<Button
										variant="ghost"
										size="sm"
										onClick={handleClearFilters}
										className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
									>
										<RotateCcw className="w-3 h-3" />
										<span>Reset Filters</span>
									</Button>
								)}
							</div>

							<div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
								{POPULAR_SKILLS.map((skill) => {
									const isSelected = selectedSkills.some(
										(s) => s.toLowerCase() === skill.toLowerCase(),
									);
									return (
										<button
											type="button"
											key={skill}
											onClick={() => handleToggleSkill(skill)}
											className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border cursor-pointer ${
												isSelected
													? "bg-primary text-primary-foreground border-primary shadow-2xs"
													: "bg-secondary/60 text-secondary-foreground border-border hover:bg-secondary hover:text-foreground"
											}`}
										>
											{skill}
											{isSelected && <span className="ml-1.5">✕</span>}
										</button>
									);
								})}

								{/* Custom Skill Input */}
								<form
									onSubmit={handleAddCustomSkill}
									className="flex items-center gap-1 ml-auto sm:ml-0"
								>
									<div className="relative">
										<Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
										<Input
											placeholder="Add skill..."
											value={customSkillInput}
											onChange={(e) => setCustomSkillInput(e.target.value)}
											className="h-7 pl-7 pr-2 text-xs w-28 sm:w-32 bg-background/50 rounded-full"
										/>
									</div>
									{customSkillInput.trim() && (
										<Button
											type="submit"
											variant="secondary"
											size="sm"
											className="h-7 px-2 text-xs rounded-full"
										>
											Add
										</Button>
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
								<div className="flex flex-wrap items-center gap-1.5 pt-1">
									<span className="text-[11px] text-muted-foreground mr-1">
										Custom filters:
									</span>
									{selectedSkills
										.filter(
											(s) =>
												!POPULAR_SKILLS.some(
													(pop) => pop.toLowerCase() === s.toLowerCase(),
												),
										)
										.map((skill) => (
											<Badge
												key={skill}
												variant="secondary"
												className="text-xs gap-1 pl-2.5 pr-1 py-0.5 bg-primary/10 text-primary border border-primary/20"
											>
												<span>{skill}</span>
												<button
													type="button"
													onClick={() => handleToggleSkill(skill)}
													className="hover:bg-primary/20 rounded-full p-0.5"
												>
													<X className="w-3 h-3" />
													<span className="sr-only">Remove {skill}</span>
												</button>
											</Badge>
										))}
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Result Count and Status Header */}
				<div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground px-1">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-foreground">
							{gigsData.total}
						</span>{" "}
						{gigsData.total === 1 ? "gig available" : "gigs available"}
						{hasActiveFilters && (
							<span className="text-muted-foreground">(filtered)</span>
						)}
					</div>

					{totalPages > 1 && (
						<div className="text-xs">
							Page{" "}
							<span className="font-medium text-foreground">{currentPage}</span>{" "}
							of{" "}
							<span className="font-medium text-foreground">{totalPages}</span>
						</div>
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
					<div className="flex items-center justify-center gap-2 pt-6 pb-12">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage <= 1}
							className="gap-1 h-9 px-3 text-xs"
						>
							<ChevronLeft className="w-4 h-4" />
							<span>Previous</span>
						</Button>

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
											<Button
												variant={
													currentPage === pageNumber ? "default" : "outline"
												}
												size="sm"
												onClick={() => handlePageChange(pageNumber)}
												className={`h-9 w-9 text-xs p-0 font-medium ${
													currentPage === pageNumber
														? "shadow-xs"
														: "border-border text-foreground hover:bg-secondary"
												}`}
											>
												{pageNumber}
											</Button>
										</div>
									);
								})}
						</div>

						<Button
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage >= totalPages}
							className="gap-1 h-9 px-3 text-xs"
						>
							<span>Next</span>
							<ChevronRight className="w-4 h-4" />
						</Button>
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
		<Card className="border-border border-dashed bg-card/60 p-8 sm:p-14 text-center my-6">
			<div className="max-w-md mx-auto space-y-4">
				<div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-xs">
					<Briefcase className="w-7 h-7" />
				</div>

				<div className="space-y-1.5">
					<h3 className="text-xl font-bold tracking-tight text-foreground font-serif">
						No campus gigs found
					</h3>
					<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
						{hasActiveFilters
							? "No projects matched your active search query or filter parameters. Try adjusting your keywords, price range, or clearing filters."
							: "There are currently no active gigs posted on the campus board. Be the first to share an opportunity with students!"}
					</p>
				</div>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
					{hasActiveFilters && (
						<Button
							variant="outline"
							onClick={onClearFilters}
							className="w-full sm:w-auto text-xs font-semibold gap-1.5"
						>
							<RotateCcw className="w-3.5 h-3.5" />
							<span>Clear All Filters</span>
						</Button>
					)}

					<Button
						asChild
						className="w-full sm:w-auto text-xs font-semibold gap-1.5 shadow-xs shadow-primary/20"
					>
						<Link to="/gigs/new">
							<Plus className="w-3.5 h-3.5" />
							<span>Post the First Gig</span>
						</Link>
					</Button>
				</div>
			</div>
		</Card>
	);
}
