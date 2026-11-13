import { connectDB } from "../src/lib/db.ts";

async function main() {
	try {
		await connectDB();
		process.exit(0);
	} catch (error) {
		console.error("Connection failed:", error);
		process.exit(1);
	}
}

main();
