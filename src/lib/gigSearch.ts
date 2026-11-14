import type { GigSortOption } from "../server/gigFns";

export interface GigSearchParams {
	q?: string;
	skills?: string[];
	minPayment?: number;
	maxPayment?: number;
	sort?: GigSortOption;
	page?: number;
}

export const GIG_SORT_OPTIONS: GigSortOption[] = [
	"newest",
	"payment-high",
	"payment-low",
	"applicants",
];

export const DEFAULT_GIG_SORT: GigSortOption = "newest";

function parseSkills(value: unknown): string[] | undefined {
	if (Array.isArray(value)) {
		const skills = value.filter(
			(s): s is string => typeof s === "string" && s.trim().length > 0,
		);
		return skills.length > 0 ? skills : undefined;
	}

	if (typeof value === "string" && value.trim().length > 0) {
		const skills = value
			.split(",")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		return skills.length > 0 ? skills : undefined;
	}

	return undefined;
}

function parsePayment(value: unknown): number | undefined {
	if (typeof value === "number" && !Number.isNaN(value)) {
		return value >= 0 ? value : undefined;
	}

	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		if (!Number.isNaN(parsed) && parsed >= 0) {
			return parsed;
		}
	}

	return undefined;
}

export function validateGigSearch(
	search: Record<string, unknown>,
): GigSearchParams {
	const sort: GigSortOption =
		typeof search.sort === "string" &&
		GIG_SORT_OPTIONS.includes(search.sort as GigSortOption)
			? (search.sort as GigSortOption)
			: DEFAULT_GIG_SORT;

	const rawPage = Number(search.page);
	const page = !Number.isNaN(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

	// Omit defaults so visiting the bare homepage does not get rewritten to
	// "/?sort=newest&page=1". Consumers fall back to these defaults themselves.
	const params: GigSearchParams = {};

	const q =
		typeof search.q === "string" && search.q.trim().length > 0
			? search.q.trim()
			: undefined;
	if (q) {
		params.q = q;
	}

	const skills = parseSkills(search.skills);
	if (skills) {
		params.skills = skills;
	}

	const minPayment = parsePayment(search.minPayment);
	if (minPayment !== undefined) {
		params.minPayment = minPayment;
	}

	const maxPayment = parsePayment(search.maxPayment);
	if (maxPayment !== undefined) {
		params.maxPayment = maxPayment;
	}

	if (sort !== DEFAULT_GIG_SORT) {
		params.sort = sort;
	}

	if (page > 1) {
		params.page = page;
	}

	return params;
}
