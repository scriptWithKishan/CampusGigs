import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import {
	AlertCircle,
	Building2,
	Check,
	CheckCircle2,
	Clock,
	Inbox,
	Loader2,
	Mail,
	RotateCw,
	Shield,
	User,
	X,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import {
	type CollegeApplicationItem,
	getCollegeApplicationsFn,
	reviewCollegeApplicationFn,
} from "../server/adminFns";
import { getCurrentUserFn } from "../server/authFns";

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		const user = await getCurrentUserFn();
		if (!user) {
			throw redirect({
				to: "/login",
			});
		}
		if (user.role !== "SUPER_ADMIN") {
			throw redirect({
				to: "/dashboard",
			});
		}
		return { user };
	},
	loader: async () => {
		const applications = await getCollegeApplicationsFn();
		return { applications };
	},
	component: AdminDashboardPage,
});

function AdminDashboardPage() {
	const router = useRouter();
	const { user } = Route.useRouteContext();
	const { applications } = Route.useLoaderData();

	const [filter, setFilter] = useState<"PENDING" | "ACTIVE" | "ALL">("PENDING");
	const [processingAction, setProcessingAction] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const handleReview = async (
		collegeId: string,
		action: "ACCEPT" | "REJECT",
		collegeName: string,
	) => {
		const actionKey = `${collegeId}-${action}`;
		try {
			setProcessingAction(actionKey);
			setFeedback(null);

			const res = await reviewCollegeApplicationFn({
				data: {
					collegeId,
					action,
				},
			});

			setFeedback({
				type: "success",
				message:
					res.message ||
					`Successfully ${action === "ACCEPT" ? "accepted" : "rejected"} portal for ${collegeName}.`,
			});

			// Invalidate router cache to refresh applications from loader
			await router.invalidate();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to review application";
			setFeedback({
				type: "error",
				message,
			});
		} finally {
			setProcessingAction(null);
		}
	};

	// Metrics
	const totalApplications = applications.length;
	const pendingCount = applications.filter(
		(a) => a.status === "PENDING",
	).length;
	const activeCount = applications.filter((a) => a.status === "ACTIVE").length;
	const rejectedCount = applications.filter(
		(a) => a.status === "REJECTED",
	).length;

	// Filtered list
	const filteredApplications = applications.filter((app) => {
		if (filter === "PENDING") return app.status === "PENDING";
		if (filter === "ACTIVE") return app.status === "ACTIVE";
		return true;
	});

	const formatAppliedDate = (dateStr?: string) => {
		if (!dateStr) return "Recently";
		try {
			const date = new Date(dateStr);
			return date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		} catch {
			return dateStr;
		}
	};

	return (
		<div className="min-h-[calc(100vh-4rem)] bg-background py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-6xl mx-auto space-y-8">
				{/* Header Banner */}
				<Card className="border-border shadow-sm bg-card">
					<CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
						<div className="flex items-start sm:items-center gap-4">
							<div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
								<Shield className="w-7 h-7" />
							</div>
							<div className="space-y-1">
								<div className="flex flex-wrap items-center gap-2.5">
									<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
										Super Admin Portal Console
									</h1>
									<Badge variant="default" className="text-xs px-2.5 py-0.5">
										Platform Authority
									</Badge>
								</div>
								<p className="text-xs sm:text-sm text-muted-foreground">
									Manage college portal applications, campus tenants, and
									institutional access
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="text-right hidden sm:block">
								<div className="text-xs font-semibold text-foreground">
									{user.name}
								</div>
								<div className="text-[11px] text-muted-foreground">
									{user.email}
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => router.invalidate()}
								className="h-9 px-3 gap-1.5 border-border text-foreground hover:bg-secondary text-xs"
								title="Refresh data"
							>
								<RotateCw className="w-3.5 h-3.5" />
								<span>Refresh</span>
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Feedback Alerts */}
				{feedback && (
					<div
						role="alert"
						className={`flex items-start gap-3 p-4 rounded-xl border text-sm transition-all ${
							feedback.type === "success"
								? "bg-primary/10 border-primary/20 text-foreground"
								: "bg-destructive/10 border-destructive/20 text-destructive"
						}`}
					>
						{feedback.type === "success" ? (
							<CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
						) : (
							<AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
						)}
						<div className="flex-1 font-medium">{feedback.message}</div>
						<button
							type="button"
							onClick={() => setFeedback(null)}
							className="text-muted-foreground hover:text-foreground text-xs"
						>
							Dismiss
						</button>
					</div>
				)}

				{/* Overview Metrics Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card className="border-border shadow-xs bg-card">
						<CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								Total Applications
							</CardTitle>
							<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
								<Building2 className="w-4 h-4" />
							</div>
						</CardHeader>
						<CardContent className="p-5 pt-0">
							<div className="text-2xl font-bold text-foreground">
								{totalApplications}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Campus tenant requests
							</p>
						</CardContent>
					</Card>

					{/* Pending Review with Alert Highlight */}
					<Card
						className={`border shadow-xs bg-card transition-all ${
							pendingCount > 0
								? "border-primary/50 bg-primary/[0.02] ring-1 ring-primary/20"
								: "border-border"
						}`}
					>
						<CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-xs font-medium text-foreground flex items-center gap-1.5">
								Pending Review
								{pendingCount > 0 && (
									<span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
								)}
							</CardTitle>
							<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
								<Clock className="w-4 h-4" />
							</div>
						</CardHeader>
						<CardContent className="p-5 pt-0">
							<div className="text-2xl font-bold text-foreground flex items-center gap-2">
								{pendingCount}
								{pendingCount > 0 && (
									<Badge
										variant="default"
										className="text-[10px] py-0 px-1.5 h-4"
									>
										Action needed
									</Badge>
								)}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Awaiting activation
							</p>
						</CardContent>
					</Card>

					<Card className="border-border shadow-xs bg-card">
						<CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								Active Campus Portals
							</CardTitle>
							<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
								<CheckCircle2 className="w-4 h-4 text-emerald-500" />
							</div>
						</CardHeader>
						<CardContent className="p-5 pt-0">
							<div className="text-2xl font-bold text-foreground">
								{activeCount}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Operational portals
							</p>
						</CardContent>
					</Card>

					<Card className="border-border shadow-xs bg-card">
						<CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								Rejected Applications
							</CardTitle>
							<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
								<XCircle className="w-4 h-4 text-muted-foreground" />
							</div>
						</CardHeader>
						<CardContent className="p-5 pt-0">
							<div className="text-2xl font-bold text-foreground">
								{rejectedCount}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Declined requests
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Filter Tabs and Applications List */}
				<Card className="border-border shadow-sm bg-card">
					<CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
						<div>
							<CardTitle className="text-lg font-bold text-foreground">
								College Portal Applications
							</CardTitle>
							<CardDescription className="text-xs text-muted-foreground">
								Review institutional credentials before permitting administrator
								access
							</CardDescription>
						</div>

						{/* Filter Tabs */}
						<div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-lg border border-border/60">
							<button
								type="button"
								onClick={() => setFilter("PENDING")}
								className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
									filter === "PENDING"
										? "bg-card text-foreground shadow-xs font-semibold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<span>Pending Review</span>
								{pendingCount > 0 && (
									<Badge
										variant="default"
										className="text-[10px] px-1.5 py-0 h-4"
									>
										{pendingCount}
									</Badge>
								)}
							</button>

							<button
								type="button"
								onClick={() => setFilter("ACTIVE")}
								className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
									filter === "ACTIVE"
										? "bg-card text-foreground shadow-xs font-semibold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<span>Active Portals</span>
								<span className="text-[10px] text-muted-foreground">
									({activeCount})
								</span>
							</button>

							<button
								type="button"
								onClick={() => setFilter("ALL")}
								className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
									filter === "ALL"
										? "bg-card text-foreground shadow-xs font-semibold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<span>All Applications</span>
								<span className="text-[10px] text-muted-foreground">
									({totalApplications})
								</span>
							</button>
						</div>
					</CardHeader>

					<CardContent className="p-6">
						{filteredApplications.length === 0 ? (
							<div className="py-16 text-center space-y-3">
								<div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mx-auto">
									<Inbox className="w-6 h-6" />
								</div>
								<h3 className="text-sm font-semibold text-foreground">
									No applications found
								</h3>
								<p className="text-xs text-muted-foreground max-w-sm mx-auto">
									{filter === "PENDING"
										? "There are currently no college portal applications awaiting review."
										: "No college applications match the selected filter."}
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{filteredApplications.map((app: CollegeApplicationItem) => {
									const isAccepting = processingAction === `${app._id}-ACCEPT`;
									const isRejecting = processingAction === `${app._id}-REJECT`;
									const isBusy = isAccepting || isRejecting;

									return (
										<div
											key={app._id}
											className="p-5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
										>
											{/* Application Details */}
											<div className="space-y-2 flex-1">
												<div className="flex items-center gap-3 flex-wrap">
													<h4 className="text-base font-bold text-foreground flex items-center gap-2">
														<Building2 className="w-4 h-4 text-primary shrink-0" />
														<span>{app.name}</span>
													</h4>

													{/* Status Badge */}
													{app.status === "PENDING" && (
														<Badge
															variant="outline"
															className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[11px] gap-1 font-medium"
														>
															<Clock className="w-3 h-3" />
															Pending Review
														</Badge>
													)}

													{app.status === "ACTIVE" && (
														<Badge
															variant="default"
															className="text-[11px] gap-1 font-medium"
														>
															<CheckCircle2 className="w-3 h-3" />
															Active Portal
														</Badge>
													)}

													{app.status === "REJECTED" && (
														<Badge
															variant="destructive"
															className="text-[11px] gap-1 font-medium"
														>
															<XCircle className="w-3 h-3" />
															Rejected
														</Badge>
													)}
												</div>

												{/* Admin contact and metadata */}
												<div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
													<div className="flex items-center gap-1.5 font-medium text-foreground">
														<User className="w-3.5 h-3.5 text-muted-foreground" />
														<span>
															{app.adminName || "College Administrator"}
														</span>
													</div>

													{app.adminEmail && (
														<div className="flex items-center gap-1.5">
															<Mail className="w-3.5 h-3.5 text-muted-foreground" />
															<span>{app.adminEmail}</span>
														</div>
													)}

													<div className="flex items-center gap-1.5">
														<Clock className="w-3.5 h-3.5 text-muted-foreground" />
														<span>
															Applied {formatAppliedDate(app.appliedAt)}
														</span>
													</div>
												</div>
											</div>

											{/* Action Controls */}
											<div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
												{app.status === "PENDING" ? (
													<>
														<Button
															variant="default"
															size="sm"
															disabled={isBusy}
															onClick={() =>
																handleReview(app._id, "ACCEPT", app.name)
															}
															className="h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
														>
															{isAccepting ? (
																<>
																	<Loader2 className="w-3.5 h-3.5 animate-spin" />
																	<span>Activating...</span>
																</>
															) : (
																<>
																	<Check className="w-3.5 h-3.5" />
																	<span>Accept &amp; Activate Portal</span>
																</>
															)}
														</Button>

														<Button
															variant="outline"
															size="sm"
															disabled={isBusy}
															onClick={() =>
																handleReview(app._id, "REJECT", app.name)
															}
															className="h-9 px-3.5 text-xs font-medium gap-1.5 border-border text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
														>
															{isRejecting ? (
																<>
																	<Loader2 className="w-3.5 h-3.5 animate-spin" />
																	<span>Rejecting...</span>
																</>
															) : (
																<>
																	<X className="w-3.5 h-3.5" />
																	<span>Reject</span>
																</>
															)}
														</Button>
													</>
												) : app.status === "ACTIVE" ? (
													<div className="flex items-center gap-2">
														<span className="text-xs text-muted-foreground flex items-center gap-1">
															<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
															Portal live
														</span>
														<Button
															variant="outline"
															size="sm"
															disabled={isBusy}
															onClick={() =>
																handleReview(app._id, "REJECT", app.name)
															}
															className="h-8 px-2.5 text-[11px] font-medium border-border text-muted-foreground hover:text-destructive hover:border-destructive/30"
														>
															Deactivate
														</Button>
													</div>
												) : (
													<div className="flex items-center gap-2">
														<span className="text-xs text-muted-foreground flex items-center gap-1">
															<XCircle className="w-3.5 h-3.5 text-destructive" />
															Application rejected
														</span>
														<Button
															variant="outline"
															size="sm"
															disabled={isBusy}
															onClick={() =>
																handleReview(app._id, "ACCEPT", app.name)
															}
															className="h-8 px-2.5 text-[11px] font-medium border-border text-foreground hover:text-primary hover:border-primary/50"
														>
															Re-evaluate &amp; Accept
														</Button>
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
