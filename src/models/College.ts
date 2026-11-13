import mongoose, { type Document, type Model, Schema } from "mongoose";

export type CollegeStatus = "PENDING" | "ACTIVE" | "REJECTED";

export interface ICollege {
	name: string;
	adminId?: mongoose.Types.ObjectId | string;
	adminName?: string;
	adminEmail?: string;
	status: CollegeStatus;
	appliedAt?: Date;
	reviewedAt?: Date;
	rejectionReason?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface ICollegeDocument extends ICollege, Document {}

const collegeSchema = new Schema<ICollegeDocument>(
	{
		name: {
			type: String,
			required: [true, "College name is required"],
			unique: true,
			trim: true,
		},
		adminId: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		adminName: {
			type: String,
			default: "",
		},
		adminEmail: {
			type: String,
			default: "",
		},
		status: {
			type: String,
			enum: ["PENDING", "ACTIVE", "REJECTED"],
			default: "PENDING",
		},
		appliedAt: {
			type: Date,
			default: Date.now,
		},
		reviewedAt: {
			type: Date,
		},
		rejectionReason: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

export const College: Model<ICollegeDocument> =
	(mongoose.models.College as Model<ICollegeDocument>) ||
	mongoose.model<ICollegeDocument>("College", collegeSchema);

export default College;
