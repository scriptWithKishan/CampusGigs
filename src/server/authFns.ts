import { createMiddleware, createServerFn } from "@tanstack/react-start";
import bcryptjs from "bcryptjs";
import connectDB from "../lib/db.ts";
import College from "../models/College.ts";
import User, { type UserRole } from "../models/User.ts";
import {
	type AuthUser,
	clearAuthCookie,
	getAuthCookie,
	setAuthCookie,
	signAccessToken,
	verifyAccessToken,
} from "./auth.ts";

export type { AuthUser, UserRole };

export interface SignUpInput {
	name: string;
	email: string;
	password: string;
	role?: "STUDENT" | "COLLEGE_ADMIN";
	collegeName: string;
}

export interface LogInInput {
	email: string;
	password: string;
}

export interface AuthResponse {
	success: true;
	user?: AuthUser;
	pendingApproval?: boolean;
	message?: string;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Server function to query all approved active colleges.
 * Returns only colleges with status === 'ACTIVE'. If none exist, returns [].
 */
export const getCollegesFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<string[]> => {
		await connectDB();

		const activeColleges = await College.find({ status: "ACTIVE" })
			.select("name")
			.lean();

		const collegeNames = activeColleges
			.map((c) => c.name?.trim())
			.filter((name): name is string => Boolean(name));

		return Array.from(new Set(collegeNames)).sort((a, b) => a.localeCompare(b));
	},
);

/**
 * Authentication middleware that verifies JWT from the cookie
 * and passes the authenticated user in context.user.
 * Throws an error if not authenticated.
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const token = getAuthCookie();
		if (!token) {
			throw new Error("Unauthorized: No token provided");
		}

		const user = await verifyAccessToken<AuthUser>(token);
		if (!user || !user.id) {
			throw new Error("Unauthorized: Invalid or expired token");
		}

		return next({
			context: {
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					collegeName: user.collegeName,
				},
			},
		});
	},
);

/**
 * Server function for user registration.
 */
export const signUpFn = createServerFn({ method: "POST" })
	.validator(
		(data: {
			name: string;
			email: string;
			password: string;
			role?: "STUDENT" | "COLLEGE_ADMIN";
			collegeName: string;
		}) => data,
	)
	.handler(async ({ data }): Promise<AuthResponse> => {
		await connectDB();

		const normalizedEmail = data.email.toLowerCase().trim();
		const existingUser = await User.findOne({ email: normalizedEmail });

		if (existingUser) {
			throw new Error("Email already registered");
		}

		const userRole: UserRole = data.role || "STUDENT";
		const rawCollegeName = data.collegeName ? data.collegeName.trim() : "";
		const hashedPassword = await bcryptjs.hash(data.password, 10);

		if (userRole === "COLLEGE_ADMIN") {
			if (!rawCollegeName) {
				throw new Error("College name is required");
			}

			const existingCollege = await College.findOne({
				name: { $regex: new RegExp(`^${escapeRegex(rawCollegeName)}$`, "i") },
			});

			if (existingCollege) {
				if (existingCollege.status === "ACTIVE") {
					throw new Error(
						"A college portal with this name already exists and is active.",
					);
				}
				if (existingCollege.status === "PENDING") {
					throw new Error(
						"An application for this college portal is already pending review.",
					);
				}
			}

			// Create College Admin user with PENDING_REVIEW status
			const user = await User.create({
				name: data.name.trim(),
				email: normalizedEmail,
				password: hashedPassword,
				role: "COLLEGE_ADMIN",
				collegeName: rawCollegeName,
				status: "PENDING_REVIEW",
			});

			// Create College application with PENDING status
			await College.create({
				name: rawCollegeName,
				adminId: user._id,
				adminName: user.name,
				adminEmail: user.email,
				status: "PENDING",
				appliedAt: new Date(),
			});

			// Do NOT set auth cookie for pending college admin
			return {
				success: true,
				pendingApproval: true,
				message:
					"Your college portal application has been submitted for Super Admin review.",
			};
		}

		// userRole === 'STUDENT'
		if (!rawCollegeName) {
			throw new Error("Please select an active, approved university portal.");
		}

		const activeCollege = await College.findOne({
			name: { $regex: new RegExp(`^${escapeRegex(rawCollegeName)}$`, "i") },
			status: "ACTIVE",
		});

		if (!activeCollege) {
			throw new Error("Please select an active, approved university portal.");
		}

		await User.create({
			name: data.name.trim(),
			email: normalizedEmail,
			password: hashedPassword,
			role: "STUDENT",
			collegeName: activeCollege.name,
			status: "PENDING_REVIEW",
		});

		return {
			success: true,
			pendingApproval: true,
			message:
				"Your student application to join " +
				activeCollege.name +
				" has been submitted to your college administrator for review.",
		};
	});

/**
 * Server function for user login.
 */
export const logInFn = createServerFn({ method: "POST" })
	.validator((data: { email: string; password: string }) => data)
	.handler(async ({ data }): Promise<AuthResponse> => {
		await connectDB();

		const normalizedEmail = data.email.toLowerCase().trim();
		const user = await User.findOne({ email: normalizedEmail });

		if (!user) {
			throw new Error("Invalid email or password");
		}

		const isPasswordValid = await bcryptjs.compare(
			data.password,
			user.password,
		);
		if (!isPasswordValid) {
			throw new Error("Invalid email or password");
		}

		if (user.role === "STUDENT" && user.status === "PENDING_REVIEW") {
			throw new Error(
				"Your student application to join " +
					user.collegeName +
					" is currently pending review by your college administrator. You will be able to log in once approved.",
			);
		}

		if (user.role === "STUDENT" && user.status === "REJECTED") {
			throw new Error(
				"Your student application to join " +
					user.collegeName +
					" was not approved by the college administrator.",
			);
		}

		if (user.role === "COLLEGE_ADMIN" && user.status === "PENDING_REVIEW") {
			throw new Error(
				"Your college portal application is currently pending review by the Super Admin. You can log in once approved.",
			);
		}

		if (user.status === "REJECTED") {
			throw new Error(
				"Your account or portal application was rejected. Please contact support.",
			);
		}

		if (user.status === "SUSPENDED") {
			throw new Error(
				"Your account has been suspended. Please contact support.",
			);
		}

		const authUser: AuthUser = {
			id: user._id.toString(),
			name: user.name,
			email: user.email,
			role: user.role as UserRole,
			collegeName: user.collegeName,
		};

		const token = await signAccessToken(authUser);
		setAuthCookie(token);

		return {
			success: true,
			user: authUser,
		};
	});

/**
 * Server function for user logout.
 */
export const logOutFn = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ success: true }> => {
		clearAuthCookie();
		return { success: true };
	},
);

/**
 * Server function to get current logged in user.
 * Returns AuthUser or null if not logged in.
 */
export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<AuthUser | null> => {
		const token = getAuthCookie();
		if (!token) {
			return null;
		}

		const payload = await verifyAccessToken<AuthUser>(token);
		if (!payload || !payload.id) {
			return null;
		}

		return {
			id: payload.id,
			name: payload.name,
			email: payload.email,
			role: payload.role,
			collegeName: payload.collegeName,
		};
	},
);
