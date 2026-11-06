"use client";

import { Check, ExternalLink, Minus } from "lucide-react";
import { fieldLabels, type Company } from "@/lib/companies";
import type { CompanyField, TraceTarget } from "@/lib/signalpost-types";
import { SignalModal } from "@/components/signalpost/modal";
import { SourceButton } from "@/components/signalpost/source-button";
import { isMissingValue, RedactedBadge } from "@/components/signalpost/redacted-badge";

type CompareViewProps = {
  companies: readonly [Company, Company];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrace: (target: TraceTarget) => void;
};

type ComparisonField = Exclude<CompanyField, "company_name">;

const comparisonFields: readonly ComparisonField[] = [
  "one_paragraph_summary",
  "official_website",
  "social_media_pages",
  "mentions_company_name_in_news",
];

function CompanyHeading({ company, index, onTrace }: {
  company: Company;
  index: number;
  onTrace: (target: TraceTarget) => void;
}) {
  return (
    <div className="min-w-0 px-5 py-5 sm:px-6">
      <p className="eyebrow mb-3 text-[#9CAEBB]">Record 0{index + 1}</p>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h3 className="min-w-0 select-none text-lg font-semibold leading-snug tracking-tight text-white [overflow-wrap:anywhere] sm:text-xl">
          {company.company_name}
        </h3>
        <div className="shrink-0">
          <SourceButton company={company} field="company_name" onTrace={onTrace} />
        </div>
      </div>
    </div>
  );
}

function ComparisonCell({ company, field, different, onTrace }: {
  company: Company;
  field: ComparisonField;
  different: boolean;
  onTrace: (target: TraceTarget) => void;
}) {
  const socialMissing = field === "social_media_pages" && isMissingValue(company.social_media_pages);
  const newsMissing = field === "mentions_company_name_in_news" && !company.mentions_company_name_in_news;
  const missing = socialMissing || newsMissing;
  const emphasized = different && !missing;
  const value = company[field];

  return (
    <div className={`min-w-0 px-5 py-5 sm:px-6 ${emphasized ? "bg-[#63F5BD]/[0.045]" : ""}`}>
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <span className="field-label select-none text-xs font-medium text-[#9CAEBB]">{fieldLabels[field]}</span>
        <div className="shrink-0">
          <SourceButton company={company} field={field} onTrace={onTrace} />
        </div>
      </div>

      {field === "one_paragraph_summary" ? (
        <p className="data-value select-text text-sm leading-7 text-white [overflow-wrap:anywhere]">{company.one_paragraph_summary}</p>
      ) : field === "official_website" || (field === "social_media_pages" && !socialMissing) ? (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className={`trace-link data-value inline-flex max-w-full select-text items-start gap-2 rounded-sm text-sm leading-6 underline decoration-[#9CAEBB]/30 underline-offset-4 transition-colors hover:text-[#63F5BD] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#63F5BD] ${emphasized ? "text-[#63F5BD] decoration-[#63F5BD]/35" : "text-white"}`}
        >
          <span className="min-w-0 [overflow-wrap:anywhere]">{String(value)}</span>
          <ExternalLink className="mt-1 shrink-0 select-none" size={13} aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : field === "social_media_pages" ? (
        <div>
          <RedactedBadge />
          <p className="mt-1 text-xs italic leading-5 text-[#94A3B8]">No social page supplied.</p>
        </div>
      ) : (
        <div>
          <div className={`inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${missing ? "border-[#27343D] text-[#94A3B8]" : emphasized ? "border-[#63F5BD]/30 bg-[#63F5BD]/[0.07] text-[#63F5BD]" : "border-[#27343D] text-white"}`}>
            {missing ? <Minus size={14} className="shrink-0" aria-hidden="true" /> : <Check size={14} className="shrink-0" aria-hidden="true" />}
            <span className={`data-value select-text font-mono ${missing ? "muted-value italic" : ""}`}>{String(company.mentions_company_name_in_news)}</span>
          </div>
          <p className={`mt-2 text-xs leading-5 ${missing ? "muted-value italic text-[#94A3B8]" : "text-[#9CAEBB]"}`}>
            {missing ? "No mention reported in the supplied record." : "Mention reported in the supplied record."}
          </p>
        </div>
      )}

      {different && (
        <p className={`mt-3 flex items-start gap-1.5 text-[11px] font-medium leading-5 ${missing ? "italic text-[#94A3B8]" : "text-[#63F5BD]"}`}>
          <span className={`mt-[7px] size-1 shrink-0 rounded-full ${missing ? "bg-[#94A3B8]" : "bg-[#63F5BD]"}`} aria-hidden="true" />
          {missing ? "Not reported · differs from other record" : "Reported · differs from other record"}
        </p>
      )}
    </div>
  );
}

export function CompareView({ companies, open, onOpenChange, onTrace }: CompareViewProps) {
  const socialDiffers = !isMissingValue(companies[0].social_media_pages) !== !isMissingValue(companies[1].social_media_pages);
  const newsDiffers = companies[0].mentions_company_name_in_news !== companies[1].mentions_company_name_in_news;
  const isDifferent = (field: ComparisonField) => field === "social_media_pages" ? socialDiffers : field === "mentions_company_name_in_news" ? newsDiffers : false;

  return (
    <SignalModal
      kind="compare"
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="SIDE-BY-SIDE INTELLIGENCE"
      title="Comparison matrix"
      description="Two supplied records, aligned field by field. Mint emphasis marks differences in reported social and news presence."
    >
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-b-[inherit] bg-[#0F171C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#63F5BD]"
        tabIndex={0}
        role="region"
        aria-label="Scrollable company comparison"
      >
        {/* Both cells belong to one row; its taller value sets both heights. */}
        <div className="hidden min-w-0 grid-cols-2 sm:grid" role="table" aria-label="Company comparison matrix">
          <div className="sticky top-0 z-10 col-span-2 grid grid-cols-2 border-b border-[#27343D] bg-[#0F171C]/95 backdrop-blur-xl" role="row">
            {companies.map((company, index) => (
              <div key={company.company_name} className={`min-w-0 ${index === 0 ? "border-r border-[#27343D]" : ""}`} role="columnheader">
                <CompanyHeading company={company} index={index} onTrace={onTrace} />
              </div>
            ))}
          </div>
          {comparisonFields.map((field) => (
            <div key={field} className="col-span-2 grid min-w-0 grid-cols-2 border-b border-[#27343D]" role="row">
              {companies.map((company, index) => (
                <div key={company.company_name} className={`min-w-0 ${index === 0 ? "border-r border-[#27343D]" : ""}`} role="cell">
                  <ComparisonCell company={company} field={field} different={isDifferent(field)} onTrace={onTrace} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Small screens preserve complete records rather than interleaving fields. */}
        <div className="min-w-0 sm:hidden">
          {companies.map((company, index) => (
            <section key={company.company_name} className="relative min-w-0 border-b border-[#27343D]" aria-label={`Comparison record: ${company.company_name}`}>
              <div className="sticky top-0 z-10 border-b border-[#27343D] bg-[#0F171C]/95 backdrop-blur-xl">
                <CompanyHeading company={company} index={index} onTrace={onTrace} />
              </div>
              {comparisonFields.map((field) => (
                <div key={field} className="min-w-0 border-b border-[#27343D] last:border-b-0">
                  <ComparisonCell company={company} field={field} different={isDifferent(field)} onTrace={onTrace} />
                </div>
              ))}
            </section>
          ))}
        </div>

        <p className="select-none px-5 py-5 text-xs leading-6 text-[#9CAEBB] sm:px-6">
          Source scope: supplied JSON only. A false news value means no mention was reported in this record, not that external coverage does not exist.
        </p>
      </div>
    </SignalModal>
  );
}
