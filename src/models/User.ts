import mongoose, { type Document, type Model, Schema } from "mongoose";

export type UserRole = "STUDENT" | "COLLEGE_ADMIN" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "PENDING_REVIEW" | "REJECTED" | "SUSPENDED";

export interface IUser {
	name: string;
	email: string;
	password: string;
	role: UserRole;
	collegeName: string;
	collegeId?: string;
	status: UserStatus;
	reviewedBy?: string;
	reviewedAt?: Date;
	rejectionReason?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: [true, "Password is required"],
		},
		role: {
			type: String,
			enum: ["STUDENT", "COLLEGE_ADMIN", "SUPER_ADMIN"],
			default: "STUDENT",
		},
		collegeName: {
			type: String,
			required: [true, "College name is required"],
		},
		collegeId: {
			type: String,
			required: false,
		},
		status: {
			type: String,
			enum: ["ACTIVE", "PENDING_REVIEW", "REJECTED", "SUSPENDED"],
			default: "ACTIVE",
		},
		reviewedBy: {
			type: String,
			required: false,
		},
		reviewedAt: {
			type: Date,
			required: false,
		},
		rejectionReason: {
			type: String,
			required: false,
		},
	},
	{
		timestamps: true,
	},
);

export const User: Model<IUserDocument> =
	(mongoose.models.User as Model<IUserDocument>) ||
	mongoose.model<IUserDocument>("User", userSchema);

export default User;
