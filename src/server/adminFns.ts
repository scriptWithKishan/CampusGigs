import { createServerFn } from "@tanstack/react-start";
import connectDB from "../lib/db.ts";
import College, { type CollegeStatus } from "../models/College.ts";
import User from "../models/User.ts";
import { type AuthUser, getAuthCookie, verifyAccessToken } from "./auth.ts";

export interface CollegeApplicationItem {
	_id: string;
	name: string;
	adminId?: string;
	adminName?: string;
	adminEmail?: string;
	status: CollegeStatus;
	appliedAt?: string;
	reviewedAt?: string;
	rejectionReason?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface ReviewApplicationInput {
	collegeId: string;
	action: "ACCEPT" | "REJECT";
	reason?: string;
}

export interface ReviewApplicationResponse {
	success: true;
	message: string;
}

async function requireSuperAdmin(): Promise<AuthUser> {
	const token = getAuthCookie();
	if (!token) {
		throw new Error("Forbidden: Super Admin only");
	}

	const user = await verifyAccessToken<AuthUser>(token);
	if (!user || user.role !== "SUPER_ADMIN") {
		throw new Error("Forbidden: Super Admin only");
	}

	return user;
}

/**
 * Server function to fetch all college applications for Super Admin review.
 * Validates caller has role === 'SUPER_ADMIN' (from token cookie). If not, throw Error('Forbidden: Super Admin only').
 * Returns all College documents sorted by appliedAt descending.
 */
export const getCollegeApplicationsFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<CollegeApplicationItem[]> => {
	await connectDB();
	await requireSuperAdmin();

	const colleges = await College.find({}).sort({ appliedAt: -1 }).lean();

	return colleges.map((c) => ({
		_id: c._id.toString(),
		name: c.name,
		adminId: c.adminId ? c.adminId.toString() : undefined,
		adminName: c.adminName || "",
		adminEmail: c.adminEmail || "",
		status: (c.status as CollegeStatus) || "PENDING",
		appliedAt: c.appliedAt ? new Date(c.appliedAt).toISOString() : undefined,
		reviewedAt: c.reviewedAt ? new Date(c.reviewedAt).toISOString() : undefined,
		rejectionReason: c.rejectionReason,
		createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : undefined,
		updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : undefined,
	}));
});

/**
 * Server function for Super Admin to review a college portal application.
 * Validates caller is 'SUPER_ADMIN'.
 * If 'ACCEPT': updates College status to 'ACTIVE', reviewedAt to new Date(), and updates the corresponding User status to 'ACTIVE'.
 * If 'REJECT': updates College status to 'REJECTED', reviewedAt to new Date(), rejectionReason to reason, and User status to 'REJECTED'.
 * Returns { success: true, message: action === 'ACCEPT' ? 'College portal approved and activated.' : 'College portal application rejected.' }
 */
export const reviewCollegeApplicationFn = createServerFn({ method: "POST" })
	.validator(
		(data: {
			collegeId: string;
			action: "ACCEPT" | "REJECT";
			reason?: string;
		}) => data,
	)
	.handler(async ({ data }): Promise<ReviewApplicationResponse> => {
		await connectDB();
		await requireSuperAdmin();

		const { collegeId, action, reason } = data;

		if (!collegeId) {
			throw new Error("College ID is required");
		}

		if (action !== "ACCEPT" && action !== "REJECT") {
			throw new Error("Invalid review action. Must be ACCEPT or REJECT.");
		}

		const college = await College.findById(collegeId);
		if (!college) {
			throw new Error("College application not found");
		}

		const reviewedAt = new Date();

		if (action === "ACCEPT") {
			college.status = "ACTIVE";
			college.reviewedAt = reviewedAt;
			college.rejectionReason = undefined;
			await college.save();

			// Update corresponding User (by adminEmail or adminId) status to 'ACTIVE'
			if (college.adminId) {
				await User.findByIdAndUpdate(college.adminId, { status: "ACTIVE" });
			}
			if (college.adminEmail) {
				await User.findOneAndUpdate(
					{ email: college.adminEmail.toLowerCase().trim() },
					{ status: "ACTIVE" },
				);
			}

			return {
				success: true,
				message: "College portal approved and activated.",
			};
		}

		// action === 'REJECT'
		college.status = "REJECTED";
		college.reviewedAt = reviewedAt;
		college.rejectionReason = reason || "Application rejected by Super Admin";
		await college.save();

		// Update corresponding User (by adminEmail or adminId) status to 'REJECTED'
		if (college.adminId) {
			await User.findByIdAndUpdate(college.adminId, { status: "REJECTED" });
		}
		if (college.adminEmail) {
			await User.findOneAndUpdate(
				{ email: college.adminEmail.toLowerCase().trim() },
				{ status: "REJECTED" },
			);
		}

		return {
			success: true,
			message: "College portal application rejected.",
		};
	});
