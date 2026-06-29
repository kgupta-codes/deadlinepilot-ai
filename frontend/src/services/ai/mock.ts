import { CAPTURE_EXTRACTION_VERSION, type ExtractedTask } from "./types";

const actionVerbPattern =
  /\b(finish|complete|submit|prepare|study|read|write|draft|build|fix|review|solve|organize|plan|schedule|send|email|call|clean|pay|buy|update|test|polish|design)\b/i;

const dueDatePatterns = [
  { pattern: /\bday after tomorrow\b/i, offsetDays: 2 },
  { pattern: /\btomorrow\b/i, offsetDays: 1 },
  { pattern: /\btoday\b/i, offsetDays: 0 },
];

const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const categoryRules: Array<{ category: string; patterns: RegExp[] }> = [
  {
    category: "Study",
    patterns: [
      /\b(homework|assignment|study|revision|revise|quiz|exam|lecture|physics|math|maths|biology|chemistry|contest|assignment)\b/i,
    ],
  },
  {
    category: "Writing",
    patterns: [/\b(essay|report|paper|article|draft|write|blog|documentation)\b/i],
  },
  {
    category: "Project",
    patterns: [/\b(project|build|implement|ship|feature|bug|fix|deploy|release)\b/i],
  },
  {
    category: "Admin",
    patterns: [/\b(email|call|follow up|follow-up|admin|schedule|meeting|calendar)\b/i],
  },
  {
    category: "Research",
    patterns: [/\b(research|investigate|compare|analyze|analysis|read up)\b/i],
  },
  {
    category: "Personal",
    patterns: [/\b(gym|workout|doctor|appointment|groceries|pay|budget|tax|clean|move)\b/i],
  },
];

const studySubtasks = [
  "Review notes",
  "Solve questions",
  "Final revision",
];

const writingSubtasks = ["Outline the structure", "Draft the first pass", "Edit and polish"];

const projectSubtasks = ["Clarify scope", "Build the core work", "Test and polish"];

const adminSubtasks = ["Gather the needed details", "Complete the action", "Confirm the result"];

const researchSubtasks = ["Collect sources", "Summarize the findings", "Turn findings into action"];

const personalSubtasks = ["Prepare what you need", "Complete the task", "Double-check the outcome"];

const genericSubtasks = ["Clarify the goal", "Work through the main steps", "Review and finish"];

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const nextWeekday = (weekdayIndex: number, reference: Date, preferNextWeek = false) => {
  const current = reference.getDay();
  let delta = weekdayIndex - current;
  if (delta <= 0) {
    delta += 7;
  }
  if (preferNextWeek) {
    delta += 7;
  }
  return addDays(reference, delta);
};

const inferCategory = (input: string) => {
  const match = categoryRules.find((rule) =>
    rule.patterns.some((pattern) => pattern.test(input))
  );

  return match?.category ?? "General";
};

const inferPriority = (input: string, dueDate: string) => {
  const lower = input.toLowerCase();

  if (
    /\b(asap|urgent|critical|immediately|today|tonight|exam|deadline|must|submit)\b/i.test(lower)
  ) {
    return "High";
  }

  if (
    /\b(no rush|whenever|someday|eventually|optional|low priority)\b/i.test(lower)
  ) {
    return "Low";
  }

  if (dueDate) {
    const parsed = new Date(`${dueDate}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      const daysAway = (parsed.getTime() - Date.now()) / 86_400_000;
      if (daysAway <= 1) {
        return "High";
      }
      if (daysAway <= 4) {
        return "Medium";
      }
    }
  }

  return "Medium";
};

const inferEstimatedHours = (input: string) => {
  const hourMatch = input.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);

  if (hourMatch?.[1]) {
    return Number(hourMatch[1]);
  }

  if (/\bhalf an hour\b/i.test(input)) {
    return 0.5;
  }

  if (/\bquarter hour\b/i.test(input)) {
    return 0.25;
  }

  if (/\bcouple of hours\b/i.test(input)) {
    return 2;
  }

  return null;
};

const inferDueDate = (input: string) => {
  const reference = new Date();
  const lower = input.toLowerCase();

  for (const rule of dueDatePatterns) {
    if (rule.pattern.test(lower)) {
      return formatDate(addDays(reference, rule.offsetDays));
    }
  }

  const weekendMatch = lower.match(/\b(this|next)\s+weekend\b/);
  if (weekendMatch) {
    const saturday = nextWeekday(6, reference, weekendMatch[1] === "next");
    return formatDate(saturday);
  }

  const weekdayMatch = lower.match(
    /\b(?:by|before|due|on|for|this|next)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
  );

  if (weekdayMatch?.[1]) {
    const weekdayIndex = weekdayNames.findIndex(
      (day) => day.toLowerCase() === weekdayMatch[1]
    );
    const preferNextWeek = /\bnext\s+/.test(lower);
    const resolved = nextWeekday(weekdayIndex, reference, preferNextWeek);
    return formatDate(resolved);
  }

  const explicitDateMatch = lower.match(
    /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/
  );

  if (explicitDateMatch) {
    const [, first, second, yearPart] = explicitDateMatch;
    const year =
      yearPart && yearPart.length === 2
        ? Number(`20${yearPart}`)
        : yearPart
          ? Number(yearPart)
          : reference.getFullYear();
    const month = Number(first);
    const day = Number(second);
    const candidate = new Date(year, month - 1, day);

    if (!Number.isNaN(candidate.getTime())) {
      return formatDate(candidate);
    }
  }

  return "";
};

const stripDueDatePhrases = (input: string) =>
  normalizeSpaces(
    input
      .replace(
        /\b(before|by|due|on|for|this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
        ""
      )
      .replace(/\b(day after tomorrow|tomorrow|today|this weekend|next weekend)\b/gi, "")
      .replace(/\b\d+(?:\.\d+)?\s*(?:hours?|hrs?|h)\b/gi, "")
      .replace(/\bhalf an hour\b/gi, "")
      .replace(/\bquarter hour\b/gi, "")
      .replace(/\bcouple of hours\b/gi, "")
  );

const deriveTitle = (input: string) => {
  const stripped = stripDueDatePhrases(input);
  const withoutLeadingVerb = stripped.replace(actionVerbPattern, "").trim();
  const withoutTrailingFiller = withoutLeadingVerb
    .replace(/[.!,;:]+$/g, "")
    .replace(/\b(please|soon|today|tomorrow|tonight)\b/gi, "")
    .trim();

  const candidates = withoutTrailingFiller
    .split(/[.;]/)
    .map((part) => normalizeSpaces(part))
    .filter(Boolean);

  const raw = candidates[0] ?? stripped;
  const cleaned = normalizeSpaces(
    raw
      .replace(/\b(my|the|a|an)\b/gi, "")
      .replace(/\b(takes?|take|about|around|roughly|approximately)\b/gi, "")
      .replace(/\b(on|before|by|for|to)\b/gi, "")
  );

  return toTitleCase(cleaned || "Untitled Task");
};

const deriveDescription = (input: string, title: string, dueDate: string, estimatedHours: number | null) => {
  const sentences = normalizeSpaces(input)
    .split(/[.?!]/)
    .map((part) => normalizeSpaces(part))
    .filter(Boolean);

  const summary = sentences[0] ?? input;
  const cleanSummary = summary === title ? input : summary;

  const detailParts = [cleanSummary];

  if (dueDate) {
    detailParts.push(`Due ${dueDate}`);
  }

  if (estimatedHours != null) {
    detailParts.push(`Estimated effort: ${estimatedHours}h`);
  }

  return normalizeSpaces(detailParts.join(". "));
};

const deriveSubtasks = (input: string, category: string) => {
  const lower = input.toLowerCase();

  if (category === "Study") {
    return studySubtasks;
  }

  if (category === "Writing") {
    return writingSubtasks;
  }

  if (category === "Project") {
    return projectSubtasks;
  }

  if (category === "Admin") {
    return adminSubtasks;
  }

  if (category === "Research") {
    return researchSubtasks;
  }

  if (category === "Personal") {
    return personalSubtasks;
  }

  if (/\b(review|revise|proofread)\b/.test(lower)) {
    return ["Review the source material", "Make the main changes", "Check the final version"];
  }

  return genericSubtasks;
};

const deriveConfidence = ({
  title,
  description,
  dueDate,
  estimatedHours,
  category,
  subtasks,
}: Pick<ExtractedTask, "title" | "description" | "dueDate" | "estimatedHours" | "category" | "subtasks">) => {
  let confidence = 54;

  if (title.length >= 6) confidence += 10;
  if (description.length >= 20) confidence += 6;
  if (dueDate) confidence += 14;
  if (estimatedHours != null) confidence += 8;
  if (category !== "General") confidence += 8;
  if (subtasks.length >= 3) confidence += 4;
  if (actionVerbPattern.test(description)) confidence += 4;

  return clamp(Math.round(confidence), 40, 98);
};

export const extractTask = (input: string): ExtractedTask => {
  const normalized = normalizeSpaces(input);
  const dueDate = inferDueDate(normalized);
  const estimatedHours = inferEstimatedHours(normalized);
  const title = deriveTitle(normalized);
  const category = inferCategory(normalized);
  const subtasks = deriveSubtasks(normalized, category);
  const description = deriveDescription(normalized, title, dueDate, estimatedHours);

  return {
    title,
    description,
    estimatedHours,
    dueDate,
    priority: inferPriority(normalized, dueDate),
    category,
    subtasks,
    confidence: deriveConfidence({
      title,
      description,
      dueDate,
      estimatedHours,
      category,
      subtasks,
    }),
    source: "mock",
  };
};

export const MOCK_EXTRACTION_VERSION = CAPTURE_EXTRACTION_VERSION;
