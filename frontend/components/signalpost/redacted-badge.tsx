export function isMissingValue(value: unknown): boolean {
  return value == null || value === "None" || (typeof value === "string" && value.trim() === "");
}

export function RedactedBadge() {
  return <span className="redacted-badge" aria-label="Redacted display: no value supplied in this record">[ REDACTED ]</span>;
}
