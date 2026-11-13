import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { cn } from "cn";
import {
	AlertCircle,
	ArrowLeft,
	Briefcase,
	DollarSign,
	GraduationCap,
	Info,
	Loader2,
	Plus,
	ShieldAlert,
	Sparkles,
	Tag,
	X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import { type AuthUser, getCurrentUserFn } from "../server/authFns";
import {
	createGigFn,
	type GigPaymentType,
	type GigStatus,
} from "../server/gigFns";

export const Route = createFileRoute("/gigs/new")({
	beforeLoad: async () => {
		const user = await getCurrentUserFn();
		if (!user) {
			throw redirect({
				to: "/login",
				search: {
					redirect: "/gigs/new",
				} as Record<string, unknown>,
			});
		}
		return { user };
	},
	loader: async ({ context }) => {
		return { user: context.user };
	},
	component: CreateGigPage,
});

const SUGGESTED_SKILLS = [
	"React",
	"TypeScript",
	"Python",
	"UI/UX Design",
	"Content Writing",
	"Video Editing",
	"Tutoring",
	"Data Analysis",
	"Web Scraping",
	"Graphic Design",
];

function CreateGigPage() {
	const router = useRouter();
	const { user } = Route.useLoaderData() as { user: AuthUser };

	// Form State
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [paymentAmount, setPaymentAmount] = useState("50");
	const [paymentType, setPaymentType] = useState<GigPaymentType>("FIXED");
	const [skills, setSkills] = useState<string[]>([]);
	const [currentSkillInput, setCurrentSkillInput] = useState("");
	const [status, setStatus] = useState<GigStatus>("OPEN");

	// UI & Validation State
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	// Guard: Only students can post gigs
	if (user.role !== "STUDENT") {
		return (
			<div className="container max-w-2xl mx-auto px-4 py-16">
				<Card className="border-amber-500/20 bg-amber-500/5 shadow-md">
					<CardHeader className="text-center pb-2">
						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
							<ShieldAlert className="h-8 w-8" />
						</div>
						<CardTitle className="text-2xl font-bold tracking-tight">
							Students Only
						</CardTitle>
						<CardDescription className="text-base">
							Only verified student accounts are eligible to post new gigs on
							CampusGigs.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-center text-sm text-muted-foreground pt-2">
						<div className="rounded-lg border bg-background/50 p-4 text-left">
							<p className="font-medium text-foreground">
								Current Account Status:
							</p>
							<p className="mt-1">
								Logged in as{" "}
								<span className="font-semibold text-foreground">
									{user.name}
								</span>{" "}
								({user.email})
							</p>
							<p className="mt-0.5 text-xs">
								Role:{" "}
								<span className="font-semibold text-foreground">
									{user.role === "COLLEGE_ADMIN"
										? "College Administrator"
										: user.role === "SUPER_ADMIN"
											? "Super Administrator"
											: user.role}
								</span>
								{user.collegeName && ` • ${user.collegeName}`}
							</p>
						</div>
						<p>
							College administrators and staff can monitor campus activity and
							manage portals from the dashboard, while gig creation is reserved
							for students.
						</p>
					</CardContent>
					<CardFooter className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
						<Button asChild variant="default" className="w-full sm:w-auto">
							<Link to="/gigs">
								<Briefcase className="mr-2 h-4 w-4" />
								Browse All Gigs
							</Link>
						</Button>
						<Button asChild variant="outline" className="w-full sm:w-auto">
							<Link to="/dashboard">Go to Dashboard</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	const handleAddSkill = (skillToAdd?: string) => {
		const raw = skillToAdd ?? currentSkillInput;
		const trimmed = raw.trim();
		if (!trimmed) return;

		if (skills.length >= 10) {
			setErrors((prev) => ({
				...prev,
				skills: "You can add up to 10 skills only.",
			}));
			return;
		}

		if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
			setErrors((prev) => ({
				...prev,
				skills: `"${trimmed}" is already added.`,
			}));
			return;
		}

		if (trimmed.length > 30) {
			setErrors((prev) => ({
				...prev,
				skills: "Skill names must be 30 characters or fewer.",
			}));
			return;
		}

		setSkills((prev) => [...prev, trimmed]);
		setCurrentSkillInput("");
		setErrors((prev) => {
			const next = { ...prev };
			delete next.skills;
			return next;
		});
	};

	const handleRemoveSkill = (skillToRemove: string) => {
		setSkills((prev) => prev.filter((s) => s !== skillToRemove));
		setErrors((prev) => {
			const next = { ...prev };
			delete next.skills;
			return next;
		});
	};

	const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			handleAddSkill();
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		const trimmedTitle = title.trim();
		if (!trimmedTitle) {
			newErrors.title = "Title is required";
		} else if (trimmedTitle.length < 5) {
			newErrors.title = `Title must be at least 5 characters (${trimmedTitle.length}/5)`;
		} else if (trimmedTitle.length > 120) {
			newErrors.title = `Title cannot exceed 120 characters (${trimmedTitle.length}/120)`;
		}

		const trimmedDesc = description.trim();
		if (!trimmedDesc) {
			newErrors.description = "Description is required";
		} else if (trimmedDesc.length < 20) {
			newErrors.description = `Description must be at least 20 characters (${trimmedDesc.length}/20)`;
		} else if (trimmedDesc.length > 2000) {
			newErrors.description = `Description cannot exceed 2000 characters (${trimmedDesc.length}/2000)`;
		}

		const amount = Number(paymentAmount);
		if (paymentAmount.trim() === "" || Number.isNaN(amount)) {
			newErrors.paymentAmount = "Please enter a valid payment amount";
		} else if (amount < 0) {
			newErrors.paymentAmount = "Payment amount cannot be negative";
		}

		if (skills.length > 10) {
			newErrors.skills = "You can add a maximum of 10 skills";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitError(null);

		setTouched({
			title: true,
			description: true,
			paymentAmount: true,
			skills: true,
		});

		if (!validateForm()) {
			return;
		}

		try {
			setIsSubmitting(true);
			const created = await createGigFn({
				data: {
					title: title.trim(),
					description: description.trim(),
					paymentAmount: Number(paymentAmount),
					paymentType,
					skills,
					status,
				},
			});

			await router.invalidate();

			await router.navigate({
				to: "/gigs/$gigId",
				params: { gigId: created.id },
			});
		} catch (err) {
			setIsSubmitting(false);
			setSubmitError(
				err instanceof Error
					? err.message
					: "Failed to publish gig. Please try again.",
			);
		}
	};

	return (
		<div className="container max-w-3xl mx-auto px-4 py-8">
			{/* Navigation header */}
			<div className="mb-6 flex items-center justify-between">
				<Link
					to="/gigs"
					className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="mr-1.5 h-4 w-4" />
					Back to Gigs
				</Link>
				<Badge variant="outline" className="gap-1.5 font-normal">
					<GraduationCap className="h-3.5 w-3.5 text-primary" />
					<span>{user.collegeName || "Campus Community"}</span>
				</Badge>
			</div>

			<Card className="border shadow-sm">
				<CardHeader className="space-y-1 pb-6 border-b">
					<div className="flex items-center gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<Sparkles className="h-5 w-5" />
						</div>
						<div>
							<CardTitle className="text-2xl font-bold tracking-tight">
								Post a New Gig
							</CardTitle>
							<CardDescription className="text-sm">
								Reach skilled students across campus to collaborate on projects,
								tasks, and assignments.
							</CardDescription>
						</div>
					</div>
				</CardHeader>

				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-6 pt-6">
						{/* Error Banner */}
						{submitError && (
							<div
								role="alert"
								className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
							>
								<AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
								<div className="space-y-1">
									<p className="font-semibold">Unable to publish gig</p>
									<p className="text-destructive/90">{submitError}</p>
								</div>
							</div>
						)}

						{/* Title Field */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="title" className="text-sm font-semibold">
									Gig Title <span className="text-destructive">*</span>
								</Label>
								<span
									className={cn(
										"text-xs",
										title.length > 120
											? "text-destructive font-medium"
											: title.length >= 5
												? "text-muted-foreground"
												: "text-muted-foreground",
									)}
								>
									{title.length}/120 characters
								</span>
							</div>
							<Input
								id="title"
								placeholder="e.g., Build a responsive landing page in React & Tailwind"
								value={title}
								maxLength={120}
								onChange={(e) => {
									setTitle(e.target.value);
									if (touched.title) {
										if (e.target.value.trim().length >= 5) {
											setErrors((prev) => {
												const next = { ...prev };
												delete next.title;
												return next;
											});
										}
									}
								}}
								onBlur={() => {
									setTouched((prev) => ({ ...prev, title: true }));
									if (title.trim().length < 5) {
										setErrors((prev) => ({
											...prev,
											title:
												title.trim().length === 0
													? "Title is required"
													: `Title must be at least 5 characters (${title.trim().length}/5)`,
										}));
									}
								}}
								aria-invalid={Boolean(errors.title)}
								disabled={isSubmitting}
							/>
							{errors.title && (
								<p className="text-xs text-destructive flex items-center gap-1 font-medium">
									<AlertCircle className="h-3.5 w-3.5" />
									{errors.title}
								</p>
							)}
							<p className="text-xs text-muted-foreground">
								Write a concise, compelling title that clearly describes the
								task or objective.
							</p>
						</div>

						{/* Description Field */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="description" className="text-sm font-semibold">
									Description <span className="text-destructive">*</span>
								</Label>
								<span
									className={cn(
										"text-xs",
										description.length > 2000
											? "text-destructive font-medium"
											: description.length >= 20
												? "text-muted-foreground"
												: "text-muted-foreground",
									)}
								>
									{description.length}/2000 characters
								</span>
							</div>
							<textarea
								id="description"
								rows={6}
								maxLength={2000}
								placeholder="Explain what needs to be done, expected deliverables, deadlines, required tools, and any relevant project context..."
								value={description}
								onChange={(e) => {
									setDescription(e.target.value);
									if (touched.description) {
										if (e.target.value.trim().length >= 20) {
											setErrors((prev) => {
												const next = { ...prev };
												delete next.description;
												return next;
											});
										}
									}
								}}
								onBlur={() => {
									setTouched((prev) => ({ ...prev, description: true }));
									if (description.trim().length < 20) {
										setErrors((prev) => ({
											...prev,
											description:
												description.trim().length === 0
													? "Description is required"
													: `Description must be at least 20 characters (${description.trim().length}/20)`,
										}));
									}
								}}
								aria-invalid={Boolean(errors.description)}
								disabled={isSubmitting}
								className={cn(
									"flex min-h-[140px] w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
									"focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
									"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 resize-y",
								)}
							/>
							{errors.description && (
								<p className="text-xs text-destructive flex items-center gap-1 font-medium">
									<AlertCircle className="h-3.5 w-3.5" />
									{errors.description}
								</p>
							)}
							<p className="text-xs text-muted-foreground">
								Be specific about your requirements to help students evaluate if
								they are a good match.
							</p>
						</div>

						{/* Payment Section: Amount and Type */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Payment Amount */}
							<div className="space-y-2">
								<Label
									htmlFor="paymentAmount"
									className="text-sm font-semibold"
								>
									Payment Amount ($) <span className="text-destructive">*</span>
								</Label>
								<div className="relative">
									<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
									<Input
										id="paymentAmount"
										type="number"
										min="0"
										step="1"
										placeholder="0"
										value={paymentAmount}
										onChange={(e) => {
											setPaymentAmount(e.target.value);
											if (touched.paymentAmount) {
												const val = Number(e.target.value);
												if (!Number.isNaN(val) && val >= 0) {
													setErrors((prev) => {
														const next = { ...prev };
														delete next.paymentAmount;
														return next;
													});
												}
											}
										}}
										onBlur={() => {
											setTouched((prev) => ({
												...prev,
												paymentAmount: true,
											}));
											const val = Number(paymentAmount);
											if (paymentAmount.trim() === "" || Number.isNaN(val)) {
												setErrors((prev) => ({
													...prev,
													paymentAmount: "Please enter a valid payment amount",
												}));
											} else if (val < 0) {
												setErrors((prev) => ({
													...prev,
													paymentAmount: "Payment cannot be negative",
												}));
											}
										}}
										aria-invalid={Boolean(errors.paymentAmount)}
										disabled={isSubmitting}
										className="pl-9"
									/>
								</div>
								{errors.paymentAmount && (
									<p className="text-xs text-destructive flex items-center gap-1 font-medium">
										<AlertCircle className="h-3.5 w-3.5" />
										{errors.paymentAmount}
									</p>
								)}
								<p className="text-xs text-muted-foreground">
									{paymentType === "HOURLY"
										? "Hourly pay rate in USD (e.g. $25/hr)"
										: "Total lump sum in USD for completion of the gig"}
								</p>
							</div>

							{/* Payment Type */}
							<div className="space-y-2">
								<Label htmlFor="paymentType" className="text-sm font-semibold">
									Payment Structure
								</Label>
								<Select
									value={paymentType}
									onValueChange={(val) => setPaymentType(val as GigPaymentType)}
									disabled={isSubmitting}
								>
									<SelectTrigger id="paymentType" className="w-full">
										<SelectValue placeholder="Select payment structure" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="FIXED">
											Fixed Price (one-time completion)
										</SelectItem>
										<SelectItem value="HOURLY">
											Hourly Rate (per hour worked)
										</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									Choose whether the applicant is paid a fixed sum or per hour.
								</p>
							</div>
						</div>

						{/* Skills Section */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label htmlFor="skillInput" className="text-sm font-semibold">
									Required Skills & Tags
								</Label>
								<span className="text-xs text-muted-foreground">
									{skills.length}/10 skills
								</span>
							</div>

							{/* Input and Add Button */}
							<div className="flex gap-2">
								<div className="relative flex-1">
									<Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
									<Input
										id="skillInput"
										placeholder="e.g. React, Python, Video Editing..."
										value={currentSkillInput}
										onChange={(e) => setCurrentSkillInput(e.target.value)}
										onKeyDown={handleSkillKeyDown}
										disabled={isSubmitting || skills.length >= 10}
										className="pl-9"
									/>
								</div>
								<Button
									type="button"
									variant="secondary"
									onClick={() => handleAddSkill()}
									disabled={
										isSubmitting ||
										!currentSkillInput.trim() ||
										skills.length >= 10
									}
								>
									<Plus className="mr-1.5 h-4 w-4" />
									Add
								</Button>
							</div>

							{errors.skills && (
								<p className="text-xs text-destructive flex items-center gap-1 font-medium">
									<AlertCircle className="h-3.5 w-3.5" />
									{errors.skills}
								</p>
							)}

							{/* Active Skill Chips */}
							{skills.length > 0 ? (
								<div className="flex flex-wrap gap-2 pt-1">
									{skills.map((skill) => (
										<Badge
											key={skill}
											variant="secondary"
											className="pl-2.5 pr-1.5 py-1 text-sm gap-1.5 bg-secondary/80 hover:bg-secondary transition-colors"
										>
											<span>{skill}</span>
											<button
												type="button"
												onClick={() => handleRemoveSkill(skill)}
												className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
												disabled={isSubmitting}
												aria-label={`Remove skill ${skill}`}
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							) : (
								<p className="text-xs text-muted-foreground italic">
									No skills added yet. Press Enter or comma to quickly add a
									tag.
								</p>
							)}

							{/* Suggested Skills */}
							{skills.length < 10 && (
								<div className="space-y-1.5 pt-1">
									<span className="text-xs text-muted-foreground font-medium">
										Suggestions:
									</span>
									<div className="flex flex-wrap gap-1.5">
										{SUGGESTED_SKILLS.filter(
											(s) =>
												!skills.some(
													(existing) =>
														existing.toLowerCase() === s.toLowerCase(),
												),
										)
											.slice(0, 6)
											.map((s) => (
												<button
													key={s}
													type="button"
													onClick={() => handleAddSkill(s)}
													disabled={isSubmitting}
													className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
												>
													<Plus className="h-3 w-3" />
													{s}
												</button>
											))}
									</div>
								</div>
							)}
						</div>

						{/* Gig Status Select */}
						<div className="space-y-2 pt-2 border-t">
							<div className="flex items-center justify-between">
								<div>
									<Label htmlFor="gigStatus" className="text-sm font-semibold">
										Initial Gig Status
									</Label>
									<p className="text-xs text-muted-foreground">
										Set whether this gig is published actively or saved as
										closed.
									</p>
								</div>
								<div className="w-48">
									<Select
										value={status}
										onValueChange={(val) => setStatus(val as GigStatus)}
										disabled={isSubmitting}
									>
										<SelectTrigger id="gigStatus">
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="OPEN">
												Open (Accepting Apps)
											</SelectItem>
											<SelectItem value="CLOSED">Closed (Draft)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</CardContent>

					<CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t bg-muted/20 py-4 px-6">
						<div className="text-xs text-muted-foreground flex items-center gap-1.5 order-2 sm:order-1">
							<Info className="h-4 w-4 shrink-0 text-muted-foreground" />
							<span>
								Posted gigs are visible to students in your college community.
							</span>
						</div>
						<div className="flex items-center gap-3 w-full sm:w-auto justify-end order-1 sm:order-2">
							<Button
								asChild
								type="button"
								variant="outline"
								disabled={isSubmitting}
							>
								<Link to="/gigs">Cancel</Link>
							</Button>
							<Button
								type="submit"
								variant="default"
								disabled={isSubmitting}
								className="min-w-[140px]"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Publishing Gig...
									</>
								) : (
									<>
										<Sparkles className="mr-2 h-4 w-4" />
										Publish Gig
									</>
								)}
							</Button>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
