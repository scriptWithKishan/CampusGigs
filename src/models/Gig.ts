import mongoose, { type Document, type Model, Schema } from "mongoose";

export type GigPaymentType = "FIXED" | "HOURLY";
export type GigStatus = "OPEN" | "CLOSED";

export interface IGig {
	title: string;
	description: string;
	paymentAmount: number;
	paymentType: GigPaymentType;
	applicantsCount: number;
	skills: string[];
	status: GigStatus;
	postedBy: mongoose.Types.ObjectId | string;
	postedByName: string;
	collegeName: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface IGigDocument extends IGig, Document {}

const gigSchema = new Schema<IGigDocument>(
	{
		title: {
			type: String,
			required: [true, "Title is required"],
			trim: true,
			minlength: [5, "Title must be at least 5 characters"],
			maxlength: [120, "Title cannot exceed 120 characters"],
		},
		description: {
			type: String,
			required: [true, "Description is required"],
			trim: true,
			minlength: [20, "Description must be at least 20 characters"],
			maxlength: [2000, "Description cannot exceed 2000 characters"],
		},
		paymentAmount: {
			type: Number,
			required: [true, "Payment amount is required"],
			min: [0, "Payment amount cannot be negative"],
		},
		paymentType: {
			type: String,
			enum: ["FIXED", "HOURLY"],
			default: "FIXED",
			required: true,
		},
		applicantsCount: {
			type: Number,
			default: 0,
			min: [0, "Applicants count cannot be negative"],
		},
		skills: {
			type: [
				{
					type: String,
					trim: true,
				},
			],
			default: [],
			validate: [
				{
					validator: (val: string[]) =>
						!val ||
						(val.length <= 10 &&
							val.every((s) => typeof s === "string" && s.trim().length > 0)),
					message: "Skills must be an array of up to 10 non-empty strings",
				},
			],
		},
		status: {
			type: String,
			enum: ["OPEN", "CLOSED"],
			default: "OPEN",
			required: true,
		},
		postedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: [true, "Posted by user is required"],
		},
		postedByName: {
			type: String,
			required: [true, "Poster name is required"],
			trim: true,
		},
		collegeName: {
			type: String,
			required: [true, "College name is required"],
			trim: true,
		},
	},
	{
		timestamps: true,
	},
);

// Indexes
gigSchema.index({ title: "text", description: "text" });
gigSchema.index({ skills: 1 });
gigSchema.index({ paymentAmount: 1 });
gigSchema.index({ createdAt: -1 });
gigSchema.index({ status: 1, createdAt: -1 });

export const Gig: Model<IGigDocument> =
	(mongoose.models.Gig as Model<IGigDocument>) ||
	mongoose.model<IGigDocument>("Gig", gigSchema);

export default Gig;
