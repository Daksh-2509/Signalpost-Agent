import { Fragment } from "react";

// Literal substring matching: input never becomes HTML or a regular expression.
export function HighlightMatch({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return <>{text}</>;
  const lower = text.toLocaleLowerCase();
  const pieces = [];
  let cursor = 0;
  let at = lower.indexOf(needle);
  while (at !== -1) {
    pieces.push(<Fragment key={`plain-${cursor}`}>{text.slice(cursor, at)}</Fragment>);
    pieces.push(<mark key={`match-${at}`} className="search-match">{text.slice(at, at + needle.length)}</mark>);
    cursor = at + needle.length;
    at = lower.indexOf(needle, cursor);
  }
  pieces.push(<Fragment key={`end-${cursor}`}>{text.slice(cursor)}</Fragment>);
  return <>{pieces}</>;
}
