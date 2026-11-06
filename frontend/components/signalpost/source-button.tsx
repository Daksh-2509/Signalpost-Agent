"use client";

import { Info } from "lucide-react";
import { fieldLabels, type Company } from "@/lib/companies";
import type { CompanyField, TraceTarget } from "@/lib/signalpost-types";

export function SourceButton({ company, field, onTrace }: {
  company: Company;
  field: CompanyField;
  onTrace: (target: TraceTarget) => void;
}) {
  return (
    <button type="button" className="source-button" aria-label={`Check source: ${fieldLabels[field]} for ${company.company_name}`} onClick={(event) => {
      event.stopPropagation();
      onTrace({ company, field });
    }}>
      <Info size={14} strokeWidth={1.7} aria-hidden="true" />
    </button>
  );
}
