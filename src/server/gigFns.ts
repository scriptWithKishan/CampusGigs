import { createServerFn } from "@tanstack/react-start";
import mongoose from "mongoose";
import connectDB from "../lib/db.ts";
import Gig, {
	type GigPaymentType,
	type GigStatus,
	type IGigDocument,
} from "../models/Gig.ts";
import { authMiddleware } from "./authFns.ts";

export type { GigPaymentType, GigStatus };

export type GigSortOption =
	| "newest"
	| "payment-high"
	| "payment-low"
	| "applicants";

export interface SerializableGig {
	id: string;
	title: string;
	description: string;
	paymentAmount: number;
	paymentType: GigPaymentType;
	applicantsCount: number;
	skills: string[];
	status: GigStatus;
	postedBy: string;
	postedByName: string;
	collegeName: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateGigInput {
	title: string;
	description: string;
	paymentAmount: number;
	paymentType?: GigPaymentType;
	skills?: string[];
	status?: GigStatus;
}

export interface ListGigsInput {
	q?: string;
	skills?: string[];
	minPayment?: number;
	maxPayment?: number;
	sort?: GigSortOption;
	page?: number;
	limit?: number;
}

export interface ListGigsResult {
	items: SerializableGig[];
	total: number;
	page: number;
	limit: number;
}

export interface ApplyToGigResult {
	success: true;
	applicantsCount: number;
	message: string;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeGig(
	doc: IGigDocument | Record<string, unknown>,
): SerializableGig {
	const rawDoc =
		doc && typeof (doc as IGigDocument).toObject === "function"
			? (doc as IGigDocument).toObject()
			: (doc as Record<string, unknown>);

	const rawId = rawDoc._id ? String(rawDoc._id) : String(rawDoc.id || "");
	const rawPostedBy =
		rawDoc.postedBy &&
		typeof rawDoc.postedBy === "object" &&
		"_id" in (rawDoc.postedBy as Record<string, unknown>)
			? String((rawDoc.postedBy as { _id: unknown })._id)
			: rawDoc.postedBy
				? String(rawDoc.postedBy)
				: "";

	const createdAtStr =
		rawDoc.createdAt instanceof Date
			? rawDoc.createdAt.toISOString()
			: typeof rawDoc.createdAt === "string"
				? rawDoc.createdAt
				: new Date().toISOString();

	const updatedAtStr =
		rawDoc.updatedAt instanceof Date
			? rawDoc.updatedAt.toISOString()
			: typeof rawDoc.updatedAt === "string"
				? rawDoc.updatedAt
				: new Date().toISOString();

	return {
		id: rawId,
		title: typeof rawDoc.title === "string" ? rawDoc.title : "",
		description:
			typeof rawDoc.description === "string" ? rawDoc.description : "",
		paymentAmount:
			typeof rawDoc.paymentAmount === "number" ? rawDoc.paymentAmount : 0,
		paymentType: rawDoc.paymentType === "HOURLY" ? "HOURLY" : "FIXED",
		applicantsCount:
			typeof rawDoc.applicantsCount === "number" ? rawDoc.applicantsCount : 0,
		skills: Array.isArray(rawDoc.skills)
			? (rawDoc.skills as unknown[]).filter(
					(s): s is string => typeof s === "string",
				)
			: [],
		status: rawDoc.status === "CLOSED" ? "CLOSED" : "OPEN",
		postedBy: rawPostedBy,
		postedByName:
			typeof rawDoc.postedByName === "string" ? rawDoc.postedByName : "",
		collegeName:
			typeof rawDoc.collegeName === "string" ? rawDoc.collegeName : "",
		createdAt: createdAtStr,
		updatedAt: updatedAtStr,
	};
}

/**
 * Server function to create a new gig posting.
 * Guarded by authMiddleware, only students can post gigs.
 */
export const createGigFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: CreateGigInput) => data)
	.handler(async ({ context, data }): Promise<SerializableGig> => {
		await connectDB();

		const caller = context.user;
		if (caller.role !== "STUDENT") {
			throw new Error("Only students can post gigs");
		}

		if (!data) {
			throw new Error("Invalid gig data");
		}

		const title = data.title?.trim();
		if (!title || title.length < 5 || title.length > 120) {
			throw new Error("Title must be between 5 and 120 characters");
		}

		const description = data.description?.trim();
		if (!description || description.length < 20 || description.length > 2000) {
			throw new Error("Description must be between 20 and 2000 characters");
		}

		const paymentAmount = Number(data.paymentAmount);
		if (Number.isNaN(paymentAmount) || paymentAmount < 0) {
			throw new Error("Payment amount must be a positive number or zero");
		}

		const paymentType: GigPaymentType =
			data.paymentType === "HOURLY" ? "HOURLY" : "FIXED";

		const rawSkills = Array.isArray(data.skills)
			? data.skills
			: typeof data.skills === "string"
				? [data.skills]
				: [];
		const cleanedSkills = Array.from(
			new Set(
				rawSkills
					.map((s) => (typeof s === "string" ? s.trim() : ""))
					.filter((s) => s.length > 0),
			),
		).slice(0, 10);

		const status: GigStatus = data.status === "CLOSED" ? "CLOSED" : "OPEN";

		const postedById = mongoose.Types.ObjectId.isValid(caller.id)
			? new mongoose.Types.ObjectId(caller.id)
			: caller.id;

		const gigDoc = await Gig.create({
			title,
			description,
			paymentAmount,
			paymentType,
			applicantsCount: 0,
			skills: cleanedSkills,
			status,
			postedBy: postedById,
			postedByName: caller.name,
			collegeName: caller.collegeName,
		});

		return serializeGig(gigDoc);
	});

/**
 * Server function to list gigs with filters, search, and pagination.
 */
export const listGigsFn = createServerFn({ method: "GET" })
	.validator((data?: ListGigsInput) => data || {})
	.handler(async ({ data = {} }): Promise<ListGigsResult> => {
		await connectDB();

		const queryConditions: Record<string, unknown>[] = [];

		// Search query filter (title and description)
		if (data.q && typeof data.q === "string" && data.q.trim().length > 0) {
			const escaped = escapeRegex(data.q.trim());
			queryConditions.push({
				$or: [
					{ title: { $regex: escaped, $options: "i" } },
					{ description: { $regex: escaped, $options: "i" } },
				],
			});
		}

		// Skills filter (matches any skill case-insensitively)
		if (data.skills) {
			const rawSkills = Array.isArray(data.skills)
				? data.skills
				: typeof data.skills === "string"
					? [data.skills]
					: [];
			const validSkills = rawSkills
				.map((s) => (typeof s === "string" ? s.trim() : ""))
				.filter((s) => s.length > 0);

			if (validSkills.length > 0) {
				const skillRegexes = validSkills.map(
					(s) => new RegExp(`^${escapeRegex(s)}$`, "i"),
				);
				queryConditions.push({
					skills: { $in: skillRegexes },
				});
			}
		}

		// Payment filters
		const paymentFilter: Record<string, number> = {};
		if (data.minPayment !== undefined && data.minPayment !== null) {
			const minVal = Number(data.minPayment);
			if (!Number.isNaN(minVal)) {
				paymentFilter.$gte = minVal;
			}
		}
		if (data.maxPayment !== undefined && data.maxPayment !== null) {
			const maxVal = Number(data.maxPayment);
			if (!Number.isNaN(maxVal)) {
				paymentFilter.$lte = maxVal;
			}
		}
		if (Object.keys(paymentFilter).length > 0) {
			queryConditions.push({ paymentAmount: paymentFilter });
		}

		const mongoQuery =
			queryConditions.length > 0 ? { $and: queryConditions } : {};

		// Sorting
		let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
		switch (data.sort) {
			case "payment-high":
				sortObj = { paymentAmount: -1, createdAt: -1 };
				break;
			case "payment-low":
				sortObj = { paymentAmount: 1, createdAt: -1 };
				break;
			case "applicants":
				sortObj = { applicantsCount: -1, createdAt: -1 };
				break;
			default:
				sortObj = { createdAt: -1 };
				break;
		}

		const page = Math.max(1, Number(data.page) || 1);
		const limit = Math.max(1, Math.min(100, Number(data.limit) || 12));
		const skip = (page - 1) * limit;

		const [total, rawDocs] = await Promise.all([
			Gig.countDocuments(mongoQuery),
			Gig.find(mongoQuery).sort(sortObj).skip(skip).limit(limit).lean(),
		]);

		return {
			items: rawDocs.map((doc) => serializeGig(doc)),
			total,
			page,
			limit,
		};
	});

/**
 * Server function to fetch a single gig by id.
 */
export const getGigFn = createServerFn({ method: "GET" })
	.validator((data: { gigId: string }) => data)
	.handler(async ({ data }): Promise<SerializableGig | null> => {
		await connectDB();

		if (!data || !data.gigId || !mongoose.Types.ObjectId.isValid(data.gigId)) {
			return null;
		}

		const gigDoc = await Gig.findById(data.gigId).lean();
		if (!gigDoc) {
			return null;
		}

		return serializeGig(gigDoc);
	});

/**
 * Server function to apply to a gig.
 * Atomically increments applicantsCount on an OPEN gig.
 */
export const applyToGigFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: { gigId: string }) => data)
	.handler(async ({ data }): Promise<ApplyToGigResult> => {
		await connectDB();

		if (!data || !data.gigId || !mongoose.Types.ObjectId.isValid(data.gigId)) {
			throw new Error("Invalid gig ID");
		}

		const updatedGig = await Gig.findOneAndUpdate(
			{ _id: data.gigId, status: "OPEN" },
			{ $inc: { applicantsCount: 1 } },
			{ new: true },
		).lean();

		if (!updatedGig) {
			throw new Error("Gig not found or is no longer open for applications");
		}

		return {
			success: true,
			applicantsCount: updatedGig.applicantsCount,
			message: "Application submitted successfully!",
		};
	});
