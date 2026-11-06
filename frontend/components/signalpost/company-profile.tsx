"use client";

import { Check, Copy, Download, ExternalLink, Minus } from "lucide-react";
import type { Company } from "@/lib/companies";
import type { TraceTarget } from "@/lib/signalpost-types";
import { SignalModal } from "@/components/signalpost/modal";
import { SourceButton } from "@/components/signalpost/source-button";
import { isMissingValue, RedactedBadge } from "@/components/signalpost/redacted-badge";

export type CompanyProfileProps = {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrace: (target: TraceTarget) => void;
  onMockAction: (action: "copy" | "export") => void;
};

export function CompanyProfile({
  company,
  open,
  onOpenChange,
  onTrace,
  onMockAction,
}: CompanyProfileProps) {
  if (!company) return null;

  const hasSocial = !isMissingValue(company.social_media_pages);
  const hasNews = company.mentions_company_name_in_news;

  return (
    <SignalModal
      open={open}
      onOpenChange={onOpenChange}
      kind="profile"
      eyebrow="COMPANY INTELLIGENCE / PROFILE"
      title={
        <span className="flex min-w-0 items-center gap-3">
          <span className="min-w-0 break-words">{company.company_name}</span>
          <SourceButton company={company} field="company_name" onTrace={onTrace} />
        </span>
      }
      description="Explore the supplied record. Check any source to inspect its original JSON field."
    >
      <div className="min-h-0 overflow-y-auto overscroll-contain">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27343D] px-5 py-4 sm:px-7">
          <div>
            <p className="eyebrow">DEMO ACTIONS</p>
            <p className="mt-1 text-xs leading-relaxed text-[#9CAEBB]">
              Simulated feedback only; no clipboard or file changes.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="icon-button"
              aria-label="Copy link (demo)"
              onClick={() => onMockAction("copy")}
            >
              <Copy size={17} strokeWidth={1.7} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Generate export (demo)"
              onClick={() => onMockAction("export")}
            >
              <Download size={18} strokeWidth={1.7} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="space-y-7 px-5 py-6 sm:px-7 sm:py-7">
          <section aria-label="Intelligence summary">
            <p className="field-label mb-3">Intelligence summary</p>
            <div className="flex items-start gap-3">
              <p className="data-value min-w-0 flex-1 select-text whitespace-pre-wrap break-words text-sm leading-7 text-white sm:text-[15px]">
                {company.one_paragraph_summary}
              </p>
              <SourceButton company={company} field="one_paragraph_summary" onTrace={onTrace} />
            </div>
          </section>

          <div className="h-px bg-[#27343D]" aria-hidden="true" />

          <section aria-label="Official website">
            <p className="field-label mb-3">Official website</p>
            <div className="flex items-start gap-3">
              <a
                href={company.official_website}
                target="_blank"
                rel="noopener noreferrer"
                className="trace-link data-value min-w-0 flex-1 select-text text-sm leading-6 text-white [overflow-wrap:anywhere]"
              >
                {company.official_website}
                <ExternalLink className="ml-2 inline-block align-middle" size={13} aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <SourceButton company={company} field="official_website" onTrace={onTrace} />
            </div>
          </section>

          <section aria-label="Social media">
            <p className="field-label mb-3">Social media</p>
            <div className="flex items-start gap-3">
              {hasSocial ? (
                <a
                  href={company.social_media_pages}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="trace-link data-value min-w-0 flex-1 select-text text-sm leading-6 text-white [overflow-wrap:anywhere]"
                >
                  {company.social_media_pages}
                  <ExternalLink className="ml-2 inline-block align-middle" size={13} aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <div className="min-w-0 flex-1"><RedactedBadge /></div>
              )}
              <SourceButton company={company} field="social_media_pages" onTrace={onTrace} />
            </div>
          </section>

          <section aria-label="News mentions">
            <p className="field-label mb-3">News mentions</p>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                {hasNews ? (
                  <span className="status-badge inline-flex items-center gap-2 text-[#63F5BD]">
                    <Check size={14} aria-hidden="true" />
                    Mention reported
                  </span>
                ) : (
                  <span className="muted-value inline-flex items-center gap-2 text-sm italic text-[#94A3B8]">
                    <Minus size={14} aria-hidden="true" />
                    No mention reported
                  </span>
                )}
                <p className="mt-3 text-xs leading-relaxed text-[#9CAEBB]">
                  As reported in the supplied JSON, not an independent news check.
                  Article sources are not included.
                </p>
              </div>
              <SourceButton company={company} field="mentions_company_name_in_news" onTrace={onTrace} />
            </div>
          </section>
        </div>
      </div>
    </SignalModal>
  );
}
