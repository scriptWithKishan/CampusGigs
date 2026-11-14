import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { cn } from "cn";
import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import type { AuthUser } from "../../../server/authFns";
import {
	createGigFn,
	type GigPaymentType,
	type GigStatus,
} from "../../../server/gigFns";

export const Route = createFileRoute("/_authenticated/gigs/new")({
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

const metaLabelClass =
	"font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

const fieldClass =
	"w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-transparent";

const fieldErrorClass =
	"border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20";

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
			<div className="w-full px-6 sm:px-10 lg:px-16 max-w-[1400px] mx-auto py-16 sm:py-24">
				<Link
					to="/"
					hash="gigs"
					className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
				>
					&larr; Back to gigs
				</Link>

				<div className="mt-10 max-w-2xl">
					<span className={metaLabelClass}>Posting restricted</span>
					<h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Only students can post gigs
					</h1>
					<p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
						Only verified student accounts are eligible to post new gigs on
						CampusGigs.
					</p>

					<div className="mt-8 rounded-lg border border-border bg-card p-6">
						<span className={metaLabelClass}>Current account</span>
						<p className="mt-3 text-sm font-medium text-foreground">
							{user.name}
						</p>
						<p className="text-sm text-muted-foreground">{user.email}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{user.role === "COLLEGE_ADMIN"
								? "College administrator"
								: user.role === "SUPER_ADMIN"
									? "Super administrator"
									: user.role}
							{user.collegeName ? ` \u00b7 ${user.collegeName}` : ""}
						</p>
					</div>

					<p className="mt-6 text-sm text-muted-foreground leading-relaxed">
						College administrators and staff can monitor campus activity and
						manage portals from the dashboard, while gig creation is reserved
						for students.
					</p>

					<div className="mt-8 flex flex-wrap items-center gap-6">
						<Link
							to="/"
							hash="gigs"
							className="text-sm font-medium text-foreground hover:text-primary transition-colors"
						>
							Browse all gigs
						</Link>
						<Link
							to="/dashboard"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							Go to dashboard
						</Link>
					</div>
				</div>
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
		<div className="w-full px-6 sm:px-10 lg:px-16 max-w-[1400px] mx-auto py-12 sm:py-16">
			{/* Navigation header */}
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6">
				<Link
					to="/"
					hash="gigs"
					className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
				>
					&larr; Back to gigs
				</Link>
				<span className={metaLabelClass}>
					{user.collegeName || "Campus community"}
				</span>
			</div>

			{/* Page header */}
			<div className="mt-10 max-w-3xl">
				<span className={metaLabelClass}>New posting</span>
				<h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
					Post a gig
				</h1>
				<p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
					Reach skilled students across campus to collaborate on projects,
					tasks, and assignments.
				</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start"
			>
				{/* Main fields */}
				<div className="lg:col-span-8 space-y-8">
					{/* Error Banner */}
					{submitError && (
						<div
							role="alert"
							className="rounded-md border border-destructive/40 p-4 text-sm text-destructive"
						>
							<p className="font-medium">Unable to publish gig</p>
							<p className="mt-1 leading-relaxed text-destructive/90">
								{submitError}
							</p>
						</div>
					)}

					{/* Title Field */}
					<div className="space-y-2">
						<div className="flex items-baseline justify-between gap-4">
							<label
								htmlFor="title"
								className="text-sm font-medium text-foreground"
							>
								Gig title <span className="text-destructive">*</span>
							</label>
							<span
								className={cn(
									"font-mono text-[11px] tracking-wider",
									title.length > 120
										? "text-destructive"
										: "text-muted-foreground",
								)}
							>
								{title.length}/120 characters
							</span>
						</div>
						<input
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
							className={cn(fieldClass, errors.title && fieldErrorClass)}
						/>
						{errors.title && (
							<p className="text-xs text-destructive">{errors.title}</p>
						)}
						<p className="text-xs text-muted-foreground leading-relaxed">
							Write a concise, compelling title that clearly describes the task
							or objective.
						</p>
					</div>

					{/* Description Field */}
					<div className="space-y-2">
						<div className="flex items-baseline justify-between gap-4">
							<label
								htmlFor="description"
								className="text-sm font-medium text-foreground"
							>
								Description <span className="text-destructive">*</span>
							</label>
							<span
								className={cn(
									"font-mono text-[11px] tracking-wider",
									description.length > 2000
										? "text-destructive"
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
								fieldClass,
								"min-h-[160px] resize-y",
								errors.description && fieldErrorClass,
							)}
						/>
						{errors.description && (
							<p className="text-xs text-destructive">{errors.description}</p>
						)}
						<p className="text-xs text-muted-foreground leading-relaxed">
							Be specific about your requirements to help students evaluate if
							they are a good match.
						</p>
					</div>

					{/* Skills Section */}
					<div className="space-y-3">
						<div className="flex items-baseline justify-between gap-4">
							<label
								htmlFor="skillInput"
								className="text-sm font-medium text-foreground"
							>
								Required skills &amp; tags
							</label>
							<span className="font-mono text-[11px] tracking-wider text-muted-foreground">
								{skills.length}/10
							</span>
						</div>

						{/* Input and Add Button */}
						<div className="flex gap-2">
							<input
								id="skillInput"
								placeholder="e.g. React, Python, Video Editing..."
								value={currentSkillInput}
								onChange={(e) => setCurrentSkillInput(e.target.value)}
								onKeyDown={handleSkillKeyDown}
								disabled={isSubmitting || skills.length >= 10}
								className={cn(fieldClass, "flex-1")}
							/>
							<button
								type="button"
								onClick={() => handleAddSkill()}
								disabled={
									isSubmitting ||
									!currentSkillInput.trim() ||
									skills.length >= 10
								}
								className="shrink-0 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Add
							</button>
						</div>

						{errors.skills && (
							<p className="text-xs text-destructive">{errors.skills}</p>
						)}

						{/* Active Skill Chips */}
						{skills.length > 0 ? (
							<div className="flex flex-wrap gap-2 pt-1">
								{skills.map((skill) => (
									<span
										key={skill}
										className="inline-flex items-center gap-1.5 rounded-md border border-foreground/25 px-2.5 py-1 text-xs text-foreground"
									>
										<span>{skill}</span>
										<button
											type="button"
											onClick={() => handleRemoveSkill(skill)}
											className="text-muted-foreground transition-colors hover:text-foreground"
											disabled={isSubmitting}
											aria-label={`Remove skill ${skill}`}
										>
											&times;
										</button>
									</span>
								))}
							</div>
						) : (
							<p className="text-xs text-muted-foreground">
								No skills added yet. Press Enter or comma to quickly add a tag.
							</p>
						)}

						{/* Suggested Skills */}
						{skills.length < 10 && (
							<div className="space-y-2 pt-1">
								<span className={metaLabelClass}>Suggestions</span>
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
												className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
											>
												{s}
											</button>
										))}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Sidebar: payment, status, and actions */}
				<aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
					<div className="space-y-6 rounded-lg border border-border bg-card p-6">
						{/* Payment Amount */}
						<div className="space-y-2">
							<label
								htmlFor="paymentAmount"
								className="text-sm font-medium text-foreground"
							>
								Payment amount (USD) <span className="text-destructive">*</span>
							</label>
							<input
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
								className={cn(
									fieldClass,
									errors.paymentAmount && fieldErrorClass,
								)}
							/>
							{errors.paymentAmount && (
								<p className="text-xs text-destructive">
									{errors.paymentAmount}
								</p>
							)}
							<p className="text-xs text-muted-foreground leading-relaxed">
								{paymentType === "HOURLY"
									? "Hourly pay rate in USD (e.g. $25/hr)"
									: "Total lump sum in USD for completion of the gig"}
							</p>
						</div>

						{/* Payment Type */}
						<div className="space-y-2 border-t border-border pt-6">
							<label
								htmlFor="paymentType"
								className="text-sm font-medium text-foreground"
							>
								Payment structure
							</label>
							<Select
								value={paymentType}
								onValueChange={(val) => setPaymentType(val as GigPaymentType)}
								disabled={isSubmitting}
							>
								<SelectTrigger id="paymentType" className={fieldClass}>
									<SelectValue placeholder="Select payment structure" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="FIXED">
										Fixed price (one-time completion)
									</SelectItem>
									<SelectItem value="HOURLY">
										Hourly rate (per hour worked)
									</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Choose whether the applicant is paid a fixed sum or per hour.
							</p>
						</div>

						{/* Gig Status Select */}
						<div className="space-y-2 border-t border-border pt-6">
							<label
								htmlFor="gigStatus"
								className="text-sm font-medium text-foreground"
							>
								Initial status
							</label>
							<Select
								value={status}
								onValueChange={(val) => setStatus(val as GigStatus)}
								disabled={isSubmitting}
							>
								<SelectTrigger id="gigStatus" className={fieldClass}>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="OPEN">
										Open (accepting applications)
									</SelectItem>
									<SelectItem value="CLOSED">Closed (draft)</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Set whether this gig is published actively or saved as closed.
							</p>
						</div>
					</div>

					{/* Actions */}
					<div className="space-y-4">
						<p className="text-xs text-muted-foreground leading-relaxed">
							Posted gigs are visible to students in your college community.
						</p>
						<div className="flex flex-wrap items-center gap-6">
							<button
								type="submit"
								disabled={isSubmitting}
								className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSubmitting ? "Publishing..." : "Publish gig"}
							</button>
							<Link
								to="/"
								hash="gigs"
								className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
							>
								Cancel
							</Link>
						</div>
					</div>
				</aside>
			</form>
		</div>
	);
}
