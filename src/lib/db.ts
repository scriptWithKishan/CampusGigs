import mongoose from "mongoose";
import { ensureSuperAdmin } from "../server/superAdmin.ts";

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis._mongooseCache ?? {
	conn: null,
	promise: null,
};

if (!globalThis._mongooseCache) {
	globalThis._mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
	const uri = process.env.MONGODB_URI;

	if (!uri) {
		throw new Error(
			"Please define the MONGODB_URI environment variable in .env",
		);
	}

	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
		};

		cached.promise = mongoose
			.connect(uri, opts)
			.then(async (mongooseInstance) => {
				console.log("MongoDB is connected");
				try {
					await ensureSuperAdmin();
				} catch (err) {
					console.warn("Could not ensure super admin upon connection:", err);
				}
				return mongooseInstance;
			})
			.catch((error) => {
				console.error("MongoDB connection error:", error);
				cached.promise = null;
				throw error;
			});
	}

	try {
		cached.conn = await cached.promise;
	} catch (error) {
		cached.promise = null;
		throw error;
	}

	return cached.conn;
}

export default connectDB;
