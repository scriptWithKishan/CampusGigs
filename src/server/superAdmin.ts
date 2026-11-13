import bcryptjs from "bcryptjs";
import College from "../models/College.ts";
import User from "../models/User.ts";

export const PRESEEDED_COLLEGES = [
	"Stanford University",
	"Massachusetts Institute of Technology",
	"UC Berkeley",
	"Harvard University",
	"Carnegie Mellon University",
	"University of Washington",
	"Columbia University",
	"Georgia Institute of Technology",
];

/**
 * Ensures that the Super Administrator account exists and has active status,
 * and removes all legacy pre-seeded colleges from MongoDB Atlas.
 */
export async function ensureSuperAdmin(): Promise<void> {
	try {
		// Clean up any legacy pre-seeded universities from database
		await College.deleteMany({ name: { $in: PRESEEDED_COLLEGES } });

		const email = (process.env.SUPER_ADMIN_EMAIL || "superadmin@campusgigs.edu")
			.toLowerCase()
			.trim();
		const password = process.env.SUPER_ADMIN_PASSWORD || "SuperAdminPass2026!";

		const existing = await User.findOne({ email });

		if (!existing) {
			const hashedPassword = await bcryptjs.hash(password, 10);
			await User.create({
				name: "Super Administrator",
				email,
				password: hashedPassword,
				role: "SUPER_ADMIN",
				status: "ACTIVE",
				collegeName: "CampusGigs HQ",
			});
			console.log(`[SuperAdmin] Super Administrator created: ${email}`);
		} else {
			let updated = false;

			if (existing.role !== "SUPER_ADMIN") {
				existing.role = "SUPER_ADMIN";
				updated = true;
			}

			if (existing.status !== "ACTIVE") {
				existing.status = "ACTIVE";
				updated = true;
			}

			if (existing.collegeName !== "CampusGigs HQ") {
				existing.collegeName = "CampusGigs HQ";
				updated = true;
			}

			const passwordMatch = await bcryptjs.compare(password, existing.password);
			if (!passwordMatch) {
				existing.password = await bcryptjs.hash(password, 10);
				updated = true;
			}

			if (updated) {
				await existing.save();
				console.log(`[SuperAdmin] Super Administrator synchronized: ${email}`);
			}
		}
	} catch (error) {
		console.error("[SuperAdmin] Error ensuring Super Admin:", error);
	}
}

export default ensureSuperAdmin;
