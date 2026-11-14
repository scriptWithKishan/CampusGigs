import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowRight,
	Award,
	Briefcase,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	DollarSign,
	ExternalLink,
	GraduationCap,
	IdCard,
	Inbox,
	Loader2,
	Mail,
	Plus,
	School,
	ShieldAlert,
	ShieldCheck,
	TrendingUp,
	User as UserIcon,
	Users,
	X,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	getStudentApplicationsFn,
	reviewStudentApplicationFn,
	type StudentApplicationItem,
} from "../../server/collegeAdminFns";

export const Route = createFileRoute("/_authenticated/dashboard")({
	loader: async ({ context }) => {
		let studentApplications: StudentApplicationItem[] = [];
		if (
			context.user.role === "COLLEGE_ADMIN" ||
			context.user.role === "SUPER_ADMIN"
		) {
			try {
				studentApplications = await getStudentApplicationsFn();
			} catch (err) {
				console.error("Failed to load student applications:", err);
			}
		}
		return { user: context.user, studentApplications };
	},
	component: DashboardPage,
});

function DashboardPage() {
	const router = useRouter();
	const { user, studentApplications = [] } = Route.useLoaderData();

	const isStudent = user.role === "STUDENT";
	const isCollegeAdmin = user.role === "COLLEGE_ADMIN";
	const isSuperAdmin = user.role === "SUPER_ADMIN";

	// Student applications filtering & processing state
	const pendingStudents = studentApplications.filter(
		(s) => s.status === "PENDING_REVIEW",
	);
	const enrolledStudents = studentApplications.filter(
		(s) => s.status === "ACTIVE",
	);
	const rejectedStudents = studentApplications.filter(
		(s) => s.status === "REJECTED",
	);
	const totalApplicantsCount = studentApplications.length;

	const [filterTab, setFilterTab] = useState<
		"PENDING" | "ENROLLED" | "REJECTED" | "ALL"
	>(() => (pendingStudents.length > 0 ? "PENDING" : "ALL"));

	const [processingStudentId, setProcessingStudentId] = useState<string | null>(
		null,
	);
	const [processingAction, setProcessingAction] = useState<
		"APPROVE" | "REJECT" | null
	>(null);
	const [rejectingStudentId, setRejectingStudentId] = useState<string | null>(
		null,
	);
	const [rejectionReasonInput, setRejectionReasonInput] = useState<string>("");
	const [actionFeedback, setActionFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const handleReviewStudent = async (
		studentId: string,
		action: "APPROVE" | "REJECT",
		rejectionReason?: string,
	) => {
		try {
			setProcessingStudentId(studentId);
			setProcessingAction(action);
			setActionFeedback(null);

			const res = await reviewStudentApplicationFn({
				data: {
					studentId,
					action,
					rejectionReason: rejectionReason?.trim() || undefined,
				},
			});

			setActionFeedback({
				type: "success",
				message:
					res.message ||
					(action === "APPROVE"
						? "Student application approved and enrolled."
						: "Student application rejected."),
			});

			if (rejectingStudentId === studentId) {
				setRejectingStudentId(null);
				setRejectionReasonInput("");
			}

			await router.invalidate();
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to process application. Please try again.";
			setActionFeedback({
				type: "error",
				message,
			});
		} finally {
			setProcessingStudentId(null);
			setProcessingAction(null);
		}
	};

	const getInitials = (name: string) => {
		return (
			name
				.trim()
				.split(/\s+/)
				.map((part) => part[0])
				.slice(0, 2)
				.join("")
				.toUpperCase() || "ST"
		);
	};

	const displayedStudents = studentApplications.filter((student) => {
		if (filterTab === "PENDING") return student.status === "PENDING_REVIEW";
		if (filterTab === "ENROLLED") return student.status === "ACTIVE";
		if (filterTab === "REJECTED") return student.status === "REJECTED";
		return true;
	});

	return (
		<div className="min-h-[calc(100vh-4rem)] bg-background py-10 px-4 sm:px-6 lg:px-8">
			<div className="max-w-6xl mx-auto space-y-8">
				{/* Prominent Super Admin Console Card at Top */}
				{isSuperAdmin && (
					<Card className="border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-md">
						<CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div className="flex items-start sm:items-center gap-4">
								<div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
									<ShieldCheck className="w-6 h-6" />
								</div>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<h2 className="text-lg font-bold tracking-tight text-foreground">
											Super Admin Console
										</h2>
										<Badge
											variant="default"
											className="text-[11px] font-semibold"
										>
											System Master
										</Badge>
									</div>
									<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
										Review and approve college portal applications, activate
										university workspaces, and oversee campus administrator
										requests.
									</p>
								</div>
							</div>
							<Button
								asChild
								size="default"
								className="font-semibold text-xs shrink-0 shadow-xs gap-1.5"
							>
								<Link to="/admin">
									Go to Admin Applications Management (/admin)
									<ArrowRight className="w-3.5 h-3.5" />
								</Link>
							</Button>
						</CardContent>
					</Card>
				)}

				{/* Top Welcome Card */}
				<Card className="border-border shadow-sm bg-card">
					<CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
						<div className="flex items-start sm:items-center gap-4">
							<div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-sm shrink-0">
								{user.name.charAt(0).toUpperCase()}
							</div>
							<div className="space-y-1">
								<div className="flex flex-wrap items-center gap-2.5">
									<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
										Welcome back, {user.name}
									</h1>
									<Badge
										variant="outline"
										className="gap-1 font-medium text-xs"
									>
										<CheckCircle2 className="w-3 h-3 text-emerald-500" />
										Verified .edu
									</Badge>
								</div>
								<p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
									<span className="flex items-center gap-1.5 font-medium text-foreground">
										<School className="w-4 h-4 text-muted-foreground" />
										{user.collegeName}
									</span>
									<span className="text-border">•</span>
									<span>
										{isStudent
											? "Student Freelancer"
											: isSuperAdmin
												? "Super Administrator"
												: "Campus Administrator"}
									</span>
								</p>
							</div>
						</div>

						{isStudent && (
							<Link
								to="/gigs/new"
								className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground transition-colors"
							>
								Post a gig
							</Link>
						)}
					</CardContent>
				</Card>

				{/* College Admin Active Campus Portal Management Hub */}
				{isCollegeAdmin && (
					<Card className="border-border shadow-sm bg-card overflow-hidden">
						<CardHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div className="space-y-1">
									<div className="flex items-center gap-2.5 flex-wrap">
										<div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
											<Building2 className="w-4 h-4" />
										</div>
										<CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
											Campus Portal: {user.collegeName}
										</CardTitle>
										<Badge
											variant="outline"
											className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold gap-1 px-2.5 py-0.5"
										>
											<CheckCircle2 className="w-3.5 h-3.5" />
											ACTIVE / APPROVED
										</Badge>
									</div>
									<CardDescription className="text-xs text-muted-foreground">
										Official institutional portal approved by CampusGigs Super
										Admin.
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-6 space-y-6">
							{/* Quick stats for campus gigs, student registrations, and moderation */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								{/* Campus Gigs */}
								<div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all space-y-1.5">
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span className="font-medium">Campus Gigs</span>
										<Briefcase className="w-4 h-4 text-primary" />
									</div>
									<div className="text-2xl font-bold text-foreground">
										38 Active
									</div>
									<p className="text-[11px] text-muted-foreground">
										14 faculty postings • 24 student requests
									</p>
								</div>

								{/* Student Registrations */}
								<div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all space-y-1.5">
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span className="font-medium">Student Registrations</span>
										<Users className="w-4 h-4 text-primary" />
									</div>
									<div className="text-2xl font-bold text-foreground">
										{enrolledStudents.length} Verified
									</div>
									<p className="text-[11px] text-muted-foreground">
										{pendingStudents.length > 0
											? `+${pendingStudents.length} registrations awaiting review`
											: "All registrations reviewed"}
									</p>
								</div>

								{/* Moderation */}
								<div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all space-y-1.5">
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span className="font-medium">Moderation</span>
										<ShieldAlert className="w-4 h-4 text-emerald-500" />
									</div>
									<div className="text-2xl font-bold text-foreground">
										0 Flagged
									</div>
									<p className="text-[11px] text-muted-foreground">
										All campus listings compliant &amp; active
									</p>
								</div>
							</div>

							{/* Actions for college admin */}
							<div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
								<Button
									size="sm"
									asChild
									className="font-medium text-xs gap-1.5"
								>
									<Link to="/" hash="gigs">
										<Plus className="w-3.5 h-3.5" />
										Browse Campus Gigs
									</Link>
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="font-medium text-xs gap-1.5"
									onClick={() => {
										const el = document.getElementById(
											"student-applications-section",
										);
										el?.scrollIntoView({ behavior: "smooth" });
										setFilterTab("PENDING");
									}}
								>
									<CheckCircle2 className="w-3.5 h-3.5 text-primary" />
									Review Student Verifications ({pendingStudents.length}{" "}
									pending)
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* College Admin: Student Applications & Campus Admission Management */}
				{isCollegeAdmin && (
					<Card
						id="student-applications-section"
						className="border-border shadow-sm bg-card overflow-hidden"
					>
						<CardHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div className="space-y-1">
									<div className="flex items-center gap-2.5 flex-wrap">
										<div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
											<GraduationCap className="w-4 h-4" />
										</div>
										<CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
											Student Applications &amp; Campus Admission
										</CardTitle>
										{pendingStudents.length > 0 && (
											<Badge
												variant="outline"
												className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold gap-1 px-2.5 py-0.5"
											>
												<span className="relative flex h-2 w-2">
													<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
													<span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
												</span>
												{pendingStudents.length} Awaiting Verification
											</Badge>
										)}
									</div>
									<CardDescription className="text-xs text-muted-foreground">
										Review and verify student freelancer admission requests for{" "}
										<span className="font-semibold text-foreground">
											{user.collegeName}
										</span>
										.
									</CardDescription>
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-6 space-y-6">
							{/* Action Feedback Banner */}
							{actionFeedback && (
								<div
									role="alert"
									className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
										actionFeedback.type === "success"
											? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
											: "bg-destructive/10 border-destructive/30 text-destructive"
									}`}
								>
									<div className="flex items-center gap-2">
										{actionFeedback.type === "success" ? (
											<CheckCircle2 className="w-4 h-4 shrink-0" />
										) : (
											<AlertCircle className="w-4 h-4 shrink-0" />
										)}
										<span className="font-medium">
											{actionFeedback.message}
										</span>
									</div>
									<button
										type="button"
										onClick={() => setActionFeedback(null)}
										className="text-muted-foreground hover:text-foreground transition-colors"
										aria-label="Dismiss feedback"
									>
										<X className="w-3.5 h-3.5" />
									</button>
								</div>
							)}

							{/* Metric Counters */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								{/* Total Applicants */}
								<button
									type="button"
									onClick={() => setFilterTab("ALL")}
									className={`p-4 rounded-xl border transition-all text-left cursor-pointer ${
										filterTab === "ALL"
											? "border-primary bg-primary/5 shadow-xs"
											: "border-border bg-card hover:bg-muted/30"
									}`}
								>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span className="font-medium">Total Applicants</span>
										<Users className="w-4 h-4 text-muted-foreground" />
									</div>
									<div className="text-2xl font-bold text-foreground mt-1.5">
										{totalApplicantsCount}
									</div>
									<p className="text-[11px] text-muted-foreground mt-0.5">
										All campus registrations
									</p>
								</button>

								{/* Pending Review with Alert Indicator */}
								<button
									type="button"
									onClick={() => setFilterTab("PENDING")}
									className={`p-4 rounded-xl border transition-all text-left cursor-pointer ${
										filterTab === "PENDING"
											? "border-amber-500 bg-amber-500/10 shadow-xs"
											: "border-border bg-card hover:bg-muted/30"
									}`}
								>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<div className="flex items-center gap-1.5">
											<span className="font-medium text-foreground">
												Pending Review
											</span>
											{pendingStudents.length > 0 && (
												<span className="relative flex h-2 w-2">
													<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
													<span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
												</span>
											)}
										</div>
										<Clock className="w-4 h-4 text-amber-500" />
									</div>
									<div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5">
										{pendingStudents.length}
									</div>
									<p className="text-[11px] text-muted-foreground mt-0.5">
										{pendingStudents.length > 0
											? "Action needed"
											: "All caught up"}
									</p>
								</button>

								{/* Enrolled / Active Students */}
								<button
									type="button"
									onClick={() => setFilterTab("ENROLLED")}
									className={`p-4 rounded-xl border transition-all text-left cursor-pointer ${
										filterTab === "ENROLLED"
											? "border-emerald-500 bg-emerald-500/10 shadow-xs"
											: "border-border bg-card hover:bg-muted/30"
									}`}
								>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span className="font-medium">Enrolled Students</span>
										<CheckCircle2 className="w-4 h-4 text-emerald-500" />
									</div>
									<div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
										{enrolledStudents.length}
									</div>
									<p className="text-[11px] text-muted-foreground mt-0.5">
										Active portal members
									</p>
								</button>

								{/* Rejected Applications */}
								<button
									type="button"
									onClick={() => setFilterTab("REJECTED")}
									className={`p-4 rounded-xl border transition-all text-left cursor-pointer ${
										filterTab === "REJECTED"
											? "border-destructive bg-destructive/10 shadow-xs"
											: "border-border bg-card hover:bg-muted/30"
									}`}
								>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span className="font-medium">Rejected</span>
										<XCircle className="w-4 h-4 text-destructive" />
									</div>
									<div className="text-2xl font-bold text-foreground mt-1.5">
										{rejectedStudents.length}
									</div>
									<p className="text-[11px] text-muted-foreground mt-0.5">
										Declined applications
									</p>
								</button>
							</div>

							{/* Filter Tabs */}
							<div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
								<Button
									variant={filterTab === "PENDING" ? "default" : "outline"}
									size="sm"
									onClick={() => setFilterTab("PENDING")}
									className="h-8 text-xs font-semibold gap-1.5"
								>
									<Clock className="w-3.5 h-3.5" />
									<span>Pending Review</span>
									<Badge
										variant={filterTab === "PENDING" ? "secondary" : "outline"}
										className="ml-1 text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-bold"
									>
										{pendingStudents.length}
									</Badge>
								</Button>

								<Button
									variant={filterTab === "ENROLLED" ? "default" : "outline"}
									size="sm"
									onClick={() => setFilterTab("ENROLLED")}
									className="h-8 text-xs font-semibold gap-1.5"
								>
									<CheckCircle2 className="w-3.5 h-3.5" />
									<span>Enrolled Students</span>
									<Badge
										variant={filterTab === "ENROLLED" ? "secondary" : "outline"}
										className="ml-1 text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-bold"
									>
										{enrolledStudents.length}
									</Badge>
								</Button>

								<Button
									variant={filterTab === "REJECTED" ? "default" : "outline"}
									size="sm"
									onClick={() => setFilterTab("REJECTED")}
									className="h-8 text-xs font-semibold gap-1.5"
								>
									<XCircle className="w-3.5 h-3.5" />
									<span>Rejected</span>
									<Badge
										variant={filterTab === "REJECTED" ? "secondary" : "outline"}
										className="ml-1 text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-bold"
									>
										{rejectedStudents.length}
									</Badge>
								</Button>

								<Button
									variant={filterTab === "ALL" ? "default" : "outline"}
									size="sm"
									onClick={() => setFilterTab("ALL")}
									className="h-8 text-xs font-semibold gap-1.5"
								>
									<Users className="w-3.5 h-3.5" />
									<span>All Applicants</span>
									<Badge
										variant={filterTab === "ALL" ? "secondary" : "outline"}
										className="ml-1 text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-bold"
									>
										{totalApplicantsCount}
									</Badge>
								</Button>
							</div>

							{/* Student List or Empty State */}
							{displayedStudents.length === 0 ? (
								<div className="text-center py-12 px-4 rounded-xl border border-dashed border-border bg-muted/10 space-y-3">
									<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
										<Inbox className="w-6 h-6" />
									</div>
									<div className="space-y-1">
										<h4 className="text-sm font-semibold text-foreground">
											{filterTab === "PENDING"
												? "No Applications Pending Review"
												: filterTab === "ENROLLED"
													? "No Enrolled Students Yet"
													: filterTab === "REJECTED"
														? "No Rejected Applications"
														: "No Student Applications Recorded"}
										</h4>
										<p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
											{filterTab === "PENDING"
												? "Great job! All incoming student verification requests for your campus have been reviewed."
												: filterTab === "ENROLLED"
													? "Students accepted into your campus portal will appear here once approved."
													: filterTab === "REJECTED"
														? "Applications rejected during verification will be logged here."
														: "When students register choosing your university, their applications will appear here for review."}
										</p>
									</div>
								</div>
							) : (
								<div className="space-y-3">
									{displayedStudents.map((student) => {
										const isPending = student.status === "PENDING_REVIEW";
										const isActive = student.status === "ACTIVE";
										const isRejected = student.status === "REJECTED";
										const isCurrentProcessing =
											processingStudentId === student.id;

										return (
											<div
												key={student.id}
												className="p-4 sm:p-5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-all space-y-3"
											>
												<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
													{/* Student Info & Avatar */}
													<div className="flex items-start sm:items-center gap-3.5">
														<div className="w-11 h-11 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
															{getInitials(student.name)}
														</div>
														<div className="space-y-1">
															<div className="flex items-center gap-2 flex-wrap">
																<h4 className="font-semibold text-sm text-foreground">
																	{student.name}
																</h4>

																{/* Status Badges */}
																{isPending && (
																	<Badge
																		variant="outline"
																		className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-medium gap-1 px-2 py-0.5"
																	>
																		<Clock className="w-3 h-3" />
																		Awaiting Review
																	</Badge>
																)}
																{isActive && (
																	<Badge
																		variant="outline"
																		className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-medium gap-1 px-2 py-0.5"
																	>
																		<CheckCircle2 className="w-3 h-3" />
																		Active / Enrolled
																	</Badge>
																)}
																{isRejected && (
																	<Badge
																		variant="outline"
																		className="bg-destructive/10 text-destructive border-destructive/30 text-[11px] font-medium gap-1 px-2 py-0.5"
																	>
																		<XCircle className="w-3 h-3" />
																		Rejected
																	</Badge>
																)}
															</div>

															<div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
																<span className="flex items-center gap-1.5">
																	<Mail className="w-3.5 h-3.5 text-muted-foreground" />
																	{student.email}
																</span>
																<span>•</span>
																<span className="flex items-center gap-1.5">
																	<Calendar className="w-3.5 h-3.5 text-muted-foreground" />
																	{isActive && student.reviewedAt
																		? `Enrolled ${new Date(
																				student.reviewedAt,
																			).toLocaleDateString("en-US", {
																				month: "short",
																				day: "numeric",
																				year: "numeric",
																			})}`
																		: student.createdAt
																			? `Submitted ${new Date(
																					student.createdAt,
																				).toLocaleDateString("en-US", {
																					month: "short",
																					day: "numeric",
																					year: "numeric",
																				})}`
																			: "Recently submitted"}
																</span>
															</div>
														</div>
													</div>

													{/* Pending Action Buttons */}
													{isPending && (
														<div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
															<Button
																variant="default"
																size="sm"
																disabled={isCurrentProcessing}
																onClick={() =>
																	handleReviewStudent(student.id, "APPROVE")
																}
																className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
															>
																{isCurrentProcessing &&
																processingAction === "APPROVE" ? (
																	<Loader2 className="w-3.5 h-3.5 animate-spin" />
																) : (
																	<CheckCircle2 className="w-3.5 h-3.5" />
																)}
																<span>Approve &amp; Enroll</span>
															</Button>

															<Button
																variant="outline"
																size="sm"
																disabled={isCurrentProcessing}
																onClick={() => {
																	if (rejectingStudentId === student.id) {
																		setRejectingStudentId(null);
																		setRejectionReasonInput("");
																	} else {
																		setRejectingStudentId(student.id);
																		setRejectionReasonInput("");
																	}
																}}
																className="h-8 px-3 text-xs font-medium gap-1.5 border-border text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
															>
																<X className="w-3.5 h-3.5" />
																<span>Reject</span>
															</Button>
														</div>
													)}
												</div>

												{/* Rejection Reason Note if Student is Rejected */}
												{isRejected && student.rejectionReason && (
													<div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
														<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
														<div className="leading-relaxed">
															<span className="font-semibold">
																Rejection Reason:{" "}
															</span>
															{student.rejectionReason}
														</div>
													</div>
												)}

												{/* Inline Rejection Prompt */}
												{rejectingStudentId === student.id && (
													<div className="p-3.5 rounded-lg border border-border/80 bg-muted/40 space-y-3 animate-in fade-in-50 duration-200">
														<div className="flex items-center justify-between">
															<Label
																htmlFor={`reject-reason-${student.id}`}
																className="text-xs font-semibold text-foreground flex items-center gap-1.5"
															>
																<AlertCircle className="w-3.5 h-3.5 text-destructive" />
																Reason for Rejection (Optional)
															</Label>
															<span className="text-[11px] text-muted-foreground">
																Visible to applicant
															</span>
														</div>
														<Input
															id={`reject-reason-${student.id}`}
															type="text"
															value={rejectionReasonInput}
															onChange={(e) =>
																setRejectionReasonInput(e.target.value)
															}
															placeholder="e.g. Unverified enrollment credentials, invalid student ID number..."
															className="h-9 text-xs bg-background"
														/>
														<div className="flex items-center justify-end gap-2">
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onClick={() => {
																	setRejectingStudentId(null);
																	setRejectionReasonInput("");
																}}
																disabled={isCurrentProcessing}
																className="h-8 text-xs font-medium"
															>
																Cancel
															</Button>
															<Button
																type="button"
																variant="destructive"
																size="sm"
																onClick={() =>
																	handleReviewStudent(
																		student.id,
																		"REJECT",
																		rejectionReasonInput,
																	)
																}
																disabled={isCurrentProcessing}
																className="h-8 text-xs font-semibold gap-1.5"
															>
																{isCurrentProcessing &&
																processingAction === "REJECT" ? (
																	<Loader2 className="w-3.5 h-3.5 animate-spin" />
																) : (
																	<X className="w-3.5 h-3.5" />
																)}
																Confirm Rejection
															</Button>
														</div>
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Overview Metrics Tiles using Shadcn Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card className="border-border shadow-xs bg-card">
						<CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								{isStudent ? "Active Gigs" : "Campus Postings"}
							</CardTitle>
							<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
								<Briefcase className="w-4 h-4" />
							</div>
						</CardHeader>
						<CardContent className="p-5 pt-0">
							<div className="text-2xl font-bold text-foreground">
								{isStudent ? "14" : "52"}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								{isStudent ? "+3 posted today" : "8 filled this week"}
							</p>
						</CardContent>
					</Card>

					<Card className="border-border shadow-xs bg-card">
						<CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								{isStudent ? "Applications" : "Student Applicants"}
							</CardTitle>
							<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
								<TrendingUp className="w-4 h-4" />
							</div>
						</CardHeader>
						<CardContent className="p-5 pt-0">
							<div className="text-2xl font-bold text-foreground">
								{isStudent ? "5" : totalApplicantsCount}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								{isStudent
									? "2 under review"
									: `${pendingStudents.length} pending review`}
							</p>
						</CardContent>
					</Card>

					<Card className="border-border shadow-xs bg-card">
						<CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								{isStudent ? "Total Earnings" : "Disbursed Budget"}
							</CardTitle>
							<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
								<DollarSign className="w-4 h-4" />
							</div>
						</CardHeader>
						<CardContent className="p-5 pt-0">
							<div className="text-2xl font-bold text-foreground">
								{isStudent ? "$1,450" : "$18,200"}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								{isStudent ? "Semester to date" : "Escrow backed"}
							</p>
						</CardContent>
					</Card>

					<Card className="border-border shadow-xs bg-card">
						<CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								{isStudent ? "Campus Rating" : "Placement Rate"}
							</CardTitle>
							<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
								<Award className="w-4 h-4" />
							</div>
						</CardHeader>
						<CardContent className="p-5 pt-0">
							<div className="text-2xl font-bold text-foreground">
								{isStudent ? "4.9 ★" : "96%"}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								{isStudent
									? "From 9 completed gigs"
									: "Department satisfaction"}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Two Column Grid: User Profile Card & Role-Specific Activity */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* User Profile Card */}
					<Card className="lg:col-span-1 border-border shadow-sm bg-card h-fit">
						<CardHeader className="pb-4 border-b border-border/60">
							<div className="flex items-center justify-between">
								<CardTitle className="text-base font-semibold flex items-center gap-2">
									<UserIcon className="w-4 h-4 text-primary" />
									Profile Information
								</CardTitle>
								<Badge
									variant={isStudent ? "default" : "secondary"}
									className="text-[11px] font-semibold gap-1"
								>
									{isStudent ? (
										<>
											<GraduationCap className="w-3 h-3" />
											Student
										</>
									) : isSuperAdmin ? (
										<>
											<ShieldCheck className="w-3 h-3" />
											Super Admin
										</>
									) : (
										<>
											<Building2 className="w-3 h-3" />
											College Admin
										</>
									)}
								</Badge>
							</div>
							<CardDescription className="text-xs text-muted-foreground">
								Verified campus identity details
							</CardDescription>
						</CardHeader>

						<CardContent className="p-6 space-y-4 text-xs">
							<div className="space-y-1">
								<span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
									Full Name
								</span>
								<p className="text-sm font-semibold text-foreground">
									{user.name}
								</p>
							</div>

							<div className="space-y-1">
								<span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
									Campus Email
								</span>
								<p className="text-xs font-medium text-foreground flex items-center gap-2 break-all">
									<Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
									{user.email}
								</p>
							</div>

							<div className="space-y-1">
								<span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
									College or University
								</span>
								<p className="text-xs font-medium text-foreground flex items-center gap-2">
									<School className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
									{user.collegeName}
								</p>
							</div>

							<div className="space-y-1">
								<span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
									Assigned Role
								</span>
								<div>
									<Badge variant="outline" className="text-xs font-medium">
										{isStudent
											? "Student Freelancer"
											: isSuperAdmin
												? "Super Administrator"
												: "College Administrator"}
									</Badge>
								</div>
							</div>

							<div className="space-y-1">
								<span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
									User Identifier
								</span>
								<p className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-md border border-border/60 break-all flex items-center gap-1.5">
									<IdCard className="w-3.5 h-3.5 shrink-0" />
									{user.id}
								</p>
							</div>

							<div className="pt-3 border-t border-border/60 flex items-center gap-2 text-[11px] text-muted-foreground">
								<ShieldCheck className="w-4 h-4 text-primary shrink-0" />
								<span>Session secured with HTTP-only JWT</span>
							</div>
						</CardContent>
					</Card>

					{/* Main Content Area */}
					<div className="lg:col-span-2 space-y-6">
						{/* Role Activity Card */}
						<Card className="border-border shadow-sm bg-card">
							<CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/60">
								<div>
									<CardTitle className="text-base font-semibold text-foreground">
										{isStudent
											? "Featured Campus Opportunities"
											: isSuperAdmin
												? "Super Admin Management Panel"
												: "Campus Administration Center"}
									</CardTitle>
									<CardDescription className="text-xs text-muted-foreground">
										{isStudent
											? "Projects tailored to your skills & campus schedule"
											: isSuperAdmin
												? "Approve portal applications and supervise campus networks"
												: "Post gigs, verify student credentials, and manage budgets"}
									</CardDescription>
								</div>
								{isStudent && (
									<Button
										variant="ghost"
										size="sm"
										className="text-xs font-medium text-primary hover:text-primary gap-1"
									>
										View All <ExternalLink className="w-3 h-3" />
									</Button>
								)}
							</CardHeader>

							<CardContent className="p-6">
								{isStudent ? (
									<div className="space-y-4">
										{/* Gig 1 */}
										<div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
											<div className="space-y-1.5">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="text-sm font-semibold text-foreground">
														UI/UX Redesign for CS Department Portal
													</span>
													<Badge variant="default" className="text-[11px]">
														$450 Fixed
													</Badge>
												</div>
												<div className="flex items-center gap-3 text-xs text-muted-foreground">
													<span>Dept of Computer Science</span>
													<span>•</span>
													<span className="flex items-center gap-1">
														<Calendar className="w-3 h-3" /> Due in 2 weeks
													</span>
												</div>
											</div>
											<Button
												size="sm"
												className="font-medium text-xs self-start sm:self-center"
											>
												Apply Now
											</Button>
										</div>

										{/* Gig 2 */}
										<div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
											<div className="space-y-1.5">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="text-sm font-semibold text-foreground">
														Annual Hackathon Event Photographer & Editor
													</span>
													<Badge variant="outline" className="text-[11px]">
														$25 / hr
													</Badge>
												</div>
												<div className="flex items-center gap-3 text-xs text-muted-foreground">
													<span>Student Union Events</span>
													<span>•</span>
													<span className="flex items-center gap-1">
														<Calendar className="w-3 h-3" /> This Weekend
													</span>
												</div>
											</div>
											<Button
												size="sm"
												className="font-medium text-xs self-start sm:self-center"
											>
												Apply Now
											</Button>
										</div>

										{/* Gig 3 */}
										<div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
											<div className="space-y-1.5">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="text-sm font-semibold text-foreground">
														Mobile App Quality Assurance & Beta Tester
													</span>
													<Badge variant="outline" className="text-[11px]">
														$20 / hr
													</Badge>
												</div>
												<div className="flex items-center gap-3 text-xs text-muted-foreground">
													<span>Campus Innovation Lab</span>
													<span>•</span>
													<span className="flex items-center gap-1">
														<Calendar className="w-3 h-3" /> Flexible Hours
													</span>
												</div>
											</div>
											<Button
												size="sm"
												className="font-medium text-xs self-start sm:self-center"
											>
												Apply Now
											</Button>
										</div>
									</div>
								) : isSuperAdmin ? (
									<div className="space-y-5">
										<div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
											<h3 className="text-sm font-semibold text-foreground">
												Platform Overview: CampusGigs HQ
											</h3>
											<p className="text-xs text-muted-foreground leading-relaxed">
												You have global platform oversight. College portals
												require your direct authorization before they are
												activated for student registrations and gig postings.
											</p>
										</div>

										<div className="flex flex-wrap gap-3">
											<Button
												asChild
												size="sm"
												className="font-medium text-xs gap-1.5"
											>
												<Link to="/admin">
													<ShieldCheck className="w-3.5 h-3.5" />
													Review Pending Portal Applications
												</Link>
											</Button>
										</div>
									</div>
								) : (
									<div className="space-y-5">
										<div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
											<h3 className="text-sm font-semibold text-foreground">
												Admin Control Center: {user.collegeName}
											</h3>
											<p className="text-xs text-muted-foreground leading-relaxed">
												You have elevated campus management privileges. Post new
												university gigs, review submitted student applications,
												and authorize milestone disbursements.
											</p>
										</div>

										<div className="flex flex-wrap gap-3">
											<Button size="sm" className="font-medium text-xs gap-1.5">
												<Plus className="w-3.5 h-3.5" />
												Post New Campus Gig
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="font-medium text-xs gap-1.5"
												onClick={() => {
													const el = document.getElementById(
														"student-applications-section",
													);
													el?.scrollIntoView({ behavior: "smooth" });
													setFilterTab("PENDING");
												}}
											>
												<CheckCircle2 className="w-3.5 h-3.5 text-primary" />
												Review Student Verifications ({pendingStudents.length}{" "}
												pending)
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
