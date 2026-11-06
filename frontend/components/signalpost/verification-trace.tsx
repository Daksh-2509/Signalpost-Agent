"use client";

import { Braces, Check, FileJson, ShieldCheck } from "lucide-react";
import type { TraceTarget } from "@/lib/signalpost-types";
import { SignalModal } from "@/components/signalpost/modal";

export type VerificationTraceProps = {
  target: TraceTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VerificationTrace({
  target,
  open,
  onOpenChange,
}: VerificationTraceProps) {
  if (!target) return null;

  // Keep source literals intact: false is "false", and "None" stays "None".
  const extractedValue = String(target.company[target.field]);

  return (
    <SignalModal
      open={open}
      onOpenChange={onOpenChange}
      kind="trace"
      eyebrow="SOURCE INSPECTION"
      title="Verification Trace"
      description={
        <>
          A direct path from the supplied JSON to the displayed value.
          <span className="sr-only"> Source record: {target.company.company_name}.</span>
        </>
      }
    >
      <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7 sm:py-7">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#63F5BD]/20 bg-[#63F5BD]/[0.04] p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#63F5BD]/20 bg-[#63F5BD]/10 text-[#63F5BD]">
              <ShieldCheck size={19} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-white">Matches supplied JSON</p>
              <p className="mt-1 text-xs text-[#9CAEBB]">Record-level verification only</p>
            </div>
          </div>
          <span className="status-badge inline-flex items-center gap-1.5 border border-[#63F5BD]/25 bg-[#63F5BD]/10 px-2.5 py-1 text-xs font-medium text-[#63F5BD] shadow-[0_0_20px_rgba(99,245,189,0.12)]">
            <Check size={13} aria-hidden="true" />
            Verified
          </span>
        </div>

        <div className="relative space-y-6">
          <div className="pointer-events-none absolute bottom-8 left-[15px] top-8 w-px bg-[#27343D]" aria-hidden="true" />

          <section className="relative flex items-start gap-3 sm:gap-4" aria-label="Original JSON Field">
            <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#27343D] bg-[#142027] text-[#9CAEBB]">
              <FileJson size={15} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="field-label mb-3">Original JSON Field</p>
              <div className="rounded-lg border border-[#27343D] bg-[#080D10]/70 px-4 py-3">
                <code className="data-value select-text font-mono text-xs leading-6 text-white [overflow-wrap:anywhere] sm:text-sm">
                  {target.field}
                </code>
              </div>
            </div>
          </section>

          <section className="relative flex items-start gap-3 sm:gap-4" aria-label="Extracted Value">
            <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#63F5BD]/25 bg-[#142027] text-[#63F5BD]">
              <Braces size={15} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="field-label mb-3">Extracted Value</p>
              <div className="rounded-lg border border-[#63F5BD]/20 bg-[#080D10]/70 px-4 py-4">
                <code className="data-value block select-text whitespace-pre-wrap font-mono text-sm leading-7 text-white [overflow-wrap:anywhere]">
                  {extractedValue}
                </code>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#9CAEBB]">
                Original value, without rewriting or inference.
              </p>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-xl border border-[#27343D] bg-[#142027]/40 p-4 sm:p-5" aria-label="Verification scope">
          <p className="eyebrow mb-3">VERIFICATION SCOPE</p>
          <p className="text-sm leading-6 text-[#9CAEBB]">
            <span className="font-medium text-white">Verified</span> means this value matches
            the user-supplied JSON record. It has not been independently fact-checked
            against company websites, registries, or news outlets.
          </p>
          <p className="mt-3 text-xs leading-6 text-[#9CAEBB]">
            No news article sources are provided in this dataset. A reported mention
            is not a linked article; a missing mention is not proof of absence.
          </p>
        </section>
      </div>
    </SignalModal>
  );
}
