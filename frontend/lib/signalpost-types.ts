import type { Company } from "@/lib/companies";

export type CompanyField = keyof Company;
export type TraceTarget = { company: Company; field: CompanyField };
