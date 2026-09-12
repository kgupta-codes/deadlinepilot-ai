import {
  type DateAmbiguity,
  type ExtractionAmbiguity,
  type ExtractedAcademicDeadline,
} from "./extractionSchema";

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const pad = (value: number) => String(value).padStart(2, "0");

export const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const isValidTime = (value: string) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const getZonedParts = (now: Date, timezone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: WEEKDAYS.indexOf(parts.weekday.toLowerCase() as (typeof WEEKDAYS)[number]),
  };
};

const toUtcDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day));

const formatIso = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const nextWeekday = (
  reference: Date,
  currentWeekday: number,
  targetWeekday: number,
  forceNextWeek: boolean
) => {
  let delta = targetWeekday - currentWeekday;
  if (delta <= 0) delta += 7;
  if (forceNextWeek) delta += 7;
  return addDays(reference, delta);
};

const parseTimeText = (text: string) => {
  const match = text.match(/\b(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const meridiem = match[3].toLowerCase();

  if (hour < 1 || hour > 12) return null;
  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  return `${pad(hour)}:${pad(minute)}`;
};

const parseExplicitDateText = (
  text: string,
  reference: Date
): { dueDate: string | null; ambiguity: DateAmbiguity; issue?: string } | null => {
  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    const yearPart = numeric[3];

    if (!yearPart && first <= 12 && second <= 12) {
      return {
        dueDate: null,
        ambiguity: "multiple_possible_dates",
        issue: "Numeric date can be read as either MM/DD or DD/MM.",
      };
    }

    const year = yearPart
      ? Number(yearPart.length === 2 ? `20${yearPart}` : yearPart)
      : reference.getUTCFullYear();
    const month = first;
    const day = second;
    const candidate = `${year}-${pad(month)}-${pad(day)}`;

    return isValidIsoDate(candidate)
      ? { dueDate: candidate, ambiguity: yearPart ? "none" : "missing_year" }
      : { dueDate: null, ambiguity: "unclear", issue: "Date is not valid." };
  }

  const dayMonthName = text.match(
    /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?(?:,?\s+(\d{4}))?\b/i
  );
  if (dayMonthName) {
    const day = Number(dayMonthName[1]);
    const month = MONTHS[dayMonthName[2].toLowerCase().replace(".", "")];
    const year = dayMonthName[3]
      ? Number(dayMonthName[3])
      : reference.getUTCFullYear();
    const candidate = `${year}-${pad(month)}-${pad(day)}`;

    return isValidIsoDate(candidate)
      ? {
          dueDate: candidate,
          ambiguity: dayMonthName[3] ? "none" : "missing_year",
        }
      : {
          dueDate: null,
          ambiguity: "unclear",
          issue: "Date is not valid.",
        };
  }

  const monthName = text.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/i
  );
  if (monthName) {
    const month = MONTHS[monthName[1].toLowerCase().replace(".", "")];
    const day = Number(monthName[2]);
    const year = monthName[3] ? Number(monthName[3]) : reference.getUTCFullYear();
    const candidate = `${year}-${pad(month)}-${pad(day)}`;

    return isValidIsoDate(candidate)
      ? { dueDate: candidate, ambiguity: monthName[3] ? "none" : "missing_year" }
      : { dueDate: null, ambiguity: "unclear", issue: "Date is not valid." };
  }

  return null;
};

const normalizeDueDateText = (
  dueDateText: string | null,
  now: Date,
  timezone: string
) => {
  if (!dueDateText) {
    return {
      dueDate: null,
      dateAmbiguity: "unclear" as DateAmbiguity,
      ambiguity: {
        field: "dueDate",
        issue: "No due date was found in the input.",
        options: [],
      } satisfies ExtractionAmbiguity,
    };
  }

  const text = dueDateText.trim().toLowerCase();
  const zoned = getZonedParts(now, timezone);
  const reference = toUtcDate(zoned.year, zoned.month, zoned.day);
  const explicit = parseExplicitDateText(text, reference);

  if (explicit) {
    return {
      dueDate: explicit.dueDate,
      dateAmbiguity: explicit.ambiguity,
      ambiguity: explicit.issue
        ? {
            field: "dueDate",
            issue: explicit.issue,
            options: [],
          }
        : null,
    };
  }

  if (/\btoday\b/.test(text)) {
    return {
      dueDate: formatIso(reference),
      dateAmbiguity: "relative_date" as DateAmbiguity,
      ambiguity: null,
    };
  }

  if (/\btomorrow\b/.test(text)) {
    return {
      dueDate: formatIso(addDays(reference, 1)),
      dateAmbiguity: "relative_date" as DateAmbiguity,
      ambiguity: null,
    };
  }

  const weekend = text.match(/\b(this|next)\s+weekend\b/);
  if (weekend) {
    return {
      dueDate: formatIso(nextWeekday(reference, zoned.weekday, 6, weekend[1] === "next")),
      dateAmbiguity: "relative_date" as DateAmbiguity,
      ambiguity: null,
    };
  }

  const weekday = text.match(
    /\b(?:(this|next)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/
  );
  if (weekday) {
    const target = WEEKDAYS.indexOf(weekday[2] as (typeof WEEKDAYS)[number]);
    return {
      dueDate: formatIso(
        nextWeekday(reference, zoned.weekday, target, weekday[1] === "next")
      ),
      dateAmbiguity: "relative_date" as DateAmbiguity,
      ambiguity: null,
    };
  }

  return {
    dueDate: null,
    dateAmbiguity: "unclear" as DateAmbiguity,
    ambiguity: {
      field: "dueDate",
      issue: "The due date wording could not be safely normalized.",
      options: [],
    } satisfies ExtractionAmbiguity,
  };
};

export const normalizeExtractedDeadlineDate = (
  deadline: ExtractedAcademicDeadline,
  now: Date,
  timezone: string
): ExtractedAcademicDeadline => {
  const normalized = normalizeDueDateText(deadline.dueDateText, now, timezone);
  const hasConfirmedDueDate =
    deadline.dueDate !== null &&
    isValidIsoDate(deadline.dueDate) &&
    deadline.dateAmbiguity === "none";
  const dueDate = hasConfirmedDueDate ? deadline.dueDate : normalized.dueDate;
  const dueTime =
    deadline.dueTime && isValidTime(deadline.dueTime)
      ? deadline.dueTime
      : deadline.dueDateText
        ? parseTimeText(deadline.dueDateText)
        : null;
  const dateAmbiguity =
    dueDate && deadline.dateAmbiguity === "none"
      ? "none"
      : normalized.dateAmbiguity;
  const ambiguities = [
    ...deadline.ambiguities,
    ...(hasConfirmedDueDate ? [] : [normalized.ambiguity]),
  ].filter((item): item is ExtractionAmbiguity => item !== null);

  return {
    ...deadline,
    dueDate,
    dueTime,
    timezone: deadline.timezone || timezone || null,
    dateAmbiguity,
    ambiguities,
  };
};
