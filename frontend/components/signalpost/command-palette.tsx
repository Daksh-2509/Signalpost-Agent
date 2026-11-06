"use client";

import { useRef } from "react";
import { Dialog } from "radix-ui";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { Company } from "@/lib/companies";
import type { TraceTarget } from "@/lib/signalpost-types";
import { HighlightMatch } from "@/components/signalpost/highlight-match";
import { SourceButton } from "@/components/signalpost/source-button";

export function CommandPalette({ open, onOpenChange, query, onQueryChange, matches, onTrace }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  matches: readonly Company[];
  onTrace: (target: TraceTarget) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="modal-overlay" />
      <Dialog.Content className="command-palette" onOpenAutoFocus={event => {
        event.preventDefault();
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        inputRef.current?.focus();
      }} onCloseAutoFocus={event => {
        event.preventDefault();
        if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
      }}>
        <div className="command-heading">
          <div><p className="eyebrow">POWER-USER ACCESS</p><Dialog.Title className="mt-2 text-lg font-medium text-white">Command Palette</Dialog.Title></div>
          <Dialog.Close className="icon-button" aria-label="Close command palette"><X size={17} aria-hidden="true" /></Dialog.Close>
        </div>
        <Dialog.Description className="command-description">Filter the directory instantly. Select a record to keep its name in search.</Dialog.Description>
        <div className="command-input-row">
          <Search size={20} aria-hidden="true" />
          <label htmlFor="command-query" className="sr-only">Filter company records</label>
          <input ref={inputRef} id="command-query" placeholder="Command Palette... Type to filter records" value={query} onChange={event => onQueryChange(event.target.value)} autoComplete="off" spellCheck={false} />
          {query && <button type="button" className="icon-button search-clear" aria-label="Clear command filter" onClick={() => { onQueryChange(""); inputRef.current?.focus(); }}><X size={15} aria-hidden="true" /></button>}
        </div>
        <div className="command-results">
          <p className="eyebrow mb-3" role="status" aria-live="polite">{matches.length} {matches.length === 1 ? "RECORD" : "RECORDS"} IN DIRECTORY</p>
          {matches.length ? <ul className="space-y-1">{matches.map(company => <li className="command-result" key={company.company_name}>
            <button type="button" className="command-result-button" onClick={() => { onQueryChange(company.company_name); onOpenChange(false); }}>
              <span className="min-w-0 break-words"><HighlightMatch text={company.company_name} query={query} /></span><ArrowUpRight size={15} aria-hidden="true" />
            </button>
            <SourceButton company={company} field="company_name" onTrace={onTrace} />
          </li>)}</ul> : <div className="command-empty"><p>No matching records.</p><button type="button" className="action-button mt-4" onClick={() => { onQueryChange(""); inputRef.current?.focus(); }}>Clear filter</button></div>}
        </div>
        <div className="command-bottom"><span>FILTERS THE MAIN DIRECTORY</span><span><kbd>ESC</kbd> to close · Tab to navigate</span></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
