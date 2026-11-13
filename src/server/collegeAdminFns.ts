import { createServerFn } from "@tanstack/react-start";
import connectDB from "../lib/db.ts";
import User, { type UserStatus } from "../models/User.ts";
import { authMiddleware } from "./authFns.ts";

export interface StudentApplicationItem {
	id: string;
	name: string;
	email: string;
	collegeName: string;
	status: UserStatus;
	createdAt?: Date;
	reviewedAt?: Date;
	rejectionReason?: string;
}

export interface ReviewStudentApplicationInput {
	studentId: string;
	action: "APPROVE" | "REJECT";
	rejectionReason?: string;
}

export interface ReviewStudentApplicationResponse {
	success: true;
	message: string;
}

/**
 * Server function to fetch student applications for college admin review.
 * College admins can only view students from their own college.
 * Super admins can view all students.
 */
export const getStudentApplicationsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }): Promise<StudentApplicationItem[]> => {
		await connectDB();

		const caller = context.user;
		if (caller.role !== "COLLEGE_ADMIN" && caller.role !== "SUPER_ADMIN") {
			throw new Error("Forbidden: College Admin access required");
		}

		const query: Record<string, unknown> = { role: "STUDENT" };
		if (caller.role === "COLLEGE_ADMIN") {
			query.collegeName = caller.collegeName;
		}

		const students = await User.find(query).lean();

		// Sorted with pending first, then by createdAt desc
		students.sort((a, b) => {
			const aIsPending = a.status === "PENDING_REVIEW" ? 0 : 1;
			const bIsPending = b.status === "PENDING_REVIEW" ? 0 : 1;

			if (aIsPending !== bIsPending) {
				return aIsPending - bIsPending;
			}

			const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			return bTime - aTime;
		});

		return students.map((student) => ({
			id: student._id.toString(),
			name: student.name,
			email: student.email,
			collegeName: student.collegeName,
			status: student.status,
			createdAt: student.createdAt ? new Date(student.createdAt) : undefined,
			reviewedAt: student.reviewedAt ? new Date(student.reviewedAt) : undefined,
			rejectionReason: student.rejectionReason,
		}));
	});

/**
 * Server function for College Admin (or Super Admin) to review student applications.
 */
export const reviewStudentApplicationFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		(data: {
			studentId: string;
			action: "APPROVE" | "REJECT";
			rejectionReason?: string;
		}) => data,
	)
	.handler(
		async ({ context, data }): Promise<ReviewStudentApplicationResponse> => {
			await connectDB();

			const caller = context.user;
			if (caller.role !== "COLLEGE_ADMIN" && caller.role !== "SUPER_ADMIN") {
				throw new Error("Forbidden: College Admin access required");
			}

			const { studentId, action, rejectionReason } = data;

			if (!studentId) {
				throw new Error("Student ID is required");
			}

			if (action !== "APPROVE" && action !== "REJECT") {
				throw new Error("Invalid review action. Must be APPROVE or REJECT.");
			}

			const student = await User.findById(studentId);
			if (!student) {
				throw new Error("Student not found");
			}

			if (
				caller.role === "COLLEGE_ADMIN" &&
				student.collegeName !== caller.collegeName
			) {
				throw new Error(
					"Forbidden: You cannot review students from another college",
				);
			}

			const reviewedAt = new Date();

			if (action === "APPROVE") {
				student.status = "ACTIVE";
				student.reviewedAt = reviewedAt;
				student.reviewedBy = caller.id;
				student.rejectionReason = undefined;
				await student.save();

				return {
					success: true,
					message: "Student approved successfully",
				};
			}

			// action === 'REJECT'
			student.status = "REJECTED";
			student.rejectionReason =
				rejectionReason || "Application rejected by college administrator";
			student.reviewedAt = reviewedAt;
			student.reviewedBy = caller.id;
			await student.save();

			return {
				success: true,
				message: "Student application rejected",
			};
		},
	);
