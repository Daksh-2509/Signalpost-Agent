"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "framer-motion";
import { ArrowDownUp, ArrowRight, Braces, Building2, Check, CheckCheck, CircleDot, FileJson2, Globe2, Layers2, Link2, Newspaper, Search, ShieldCheck, X } from "lucide-react";
import { companies, type Company } from "@/lib/companies";
import type { TraceTarget } from "@/lib/signalpost-types";
import { SourceButton } from "@/components/signalpost/source-button";
import { HighlightMatch } from "@/components/signalpost/highlight-match";
import { CompanyProfile } from "@/components/signalpost/company-profile";
import { VerificationTrace } from "@/components/signalpost/verification-trace";
import { CompareView } from "@/components/signalpost/compare-view";
import { BootSequence } from "@/components/signalpost/boot-sequence";
import { CommandPalette } from "@/components/signalpost/command-palette";
import { LiveTelemetry } from "@/components/signalpost/live-telemetry";
import { isMissingValue, RedactedBadge } from "@/components/signalpost/redacted-badge";

function SkeletonCards() {
  return <div className="company-grid" aria-hidden="true">{[0, 1, 2].map((i) => <div className="company-card skeleton-card" key={i}>
    <div className="skeleton h-10 w-10 rounded-xl" />
    <div className="skeleton mt-6 h-6 w-3/4" />
    <div className="skeleton mt-6 h-3 w-full" /><div className="skeleton mt-3 h-3 w-5/6" /><div className="skeleton mt-3 h-3 w-2/3" />
    <div className="mt-9 space-y-5">{[0, 1, 2].map(j => <div key={j} className="skeleton h-8 w-full" />)}</div>
  </div>)}</div>;
}

export function Dashboard() {
  const [query, setQuery] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [profile, setProfile] = useState<Company | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [trace, setTrace] = useState<TraceTarget | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();
  const [bootActive, setBootActive] = useState(true);
  const [dashboardRevealed, setDashboardRevealed] = useState(false);
  const revealDashboard = useCallback(() => setDashboardRevealed(true), []);
  const [bootState, setBootState] = useState<"pending" | "running" | "finished">("pending");
  const [commandOpen, setCommandOpen] = useState(false);
  const finishBoot = useCallback((playGlitch: boolean) => {
    setDashboardRevealed(true);
    setBootActive(false);
    setBootState(playGlitch ? "running" : "finished");
  }, []);

  useEffect(() => {
    if (bootActive) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [bootActive]);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (event.repeat || event.isComposing || bootActive || profileOpen || compareOpen || traceOpen) return;
        setCommandOpen(true);
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [bootActive, profileOpen, compareOpen, traceOpen]);

  useEffect(() => () => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const needle = query.trim().toLocaleLowerCase();
  const visible = companies.filter(company => !needle || company.company_name.toLocaleLowerCase().includes(needle) || company.one_paragraph_summary.toLocaleLowerCase().includes(needle));
  const selectedCompanies = selected.map(name => companies.find(c => c.company_name === name)!).filter(Boolean);

  function briefLoad() {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    if (reduced) { setLoading(false); return; }
    setLoading(true);
    loadingTimer.current = setTimeout(() => setLoading(false), 150);
  }
  function clearSearch() {
    setQuery("");
    briefLoad();
    searchRef.current?.focus();
  }
  function toggleCompare() {
    const next = !compareMode;
    setCompareMode(next);
    if (!next) { setSelected([]); setCompareOpen(false); }
    briefLoad();
  }
  function select(company: Company) {
    setSelected(current => current.includes(company.company_name)
      ? current.filter(name => name !== company.company_name)
      : current.length < 2 ? [...current, company.company_name] : current);
  }
  function openProfile(company: Company) { setProfile(company); setProfileOpen(true); }
  function openTrace(target: TraceTarget) { setTrace(target); setTraceOpen(true); }
  function mockAction(action: "copy" | "export") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message: action === "copy" ? "Link copied to clipboard" : "Export generated" });
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }

  return <MotionConfig reducedMotion="user">
    {bootActive && <BootSequence onFinish={finishBoot} onReveal={revealDashboard} />}
    <div className="dashboard-shell" data-boot-reveal={bootActive ? (dashboardRevealed ? "revealing" : "pending") : "complete"} inert={bootActive} aria-hidden={bootActive || undefined}>
      <a className="skip-link" href="#intelligence">Skip to company intelligence</a>
      <header className="site-header chrome">
        <div className="brand-lockup">
          <span className="brand-signal" aria-hidden="true"><span /><span /><span /></span>
          <div className="brand-name">Signalpost<span className="brand-descriptor">Intelligence</span></div>
          <span className="workspace-tag">ANALYST WORKSPACE</span>
        </div>
        <div className="header-status"><span className="status-dot" /> <span>System operational</span><span className="header-divider" /><FileJson2 size={14} aria-hidden="true" /><span>JSON dataset</span></div>
      </header>

      <main id="intelligence" tabIndex={-1} className="workspace">
        <div className="workspace-breadcrumb chrome"><span className="breadcrumb-line" /> WORKSPACE <span>/</span> COMPANY DIRECTORY</div>
        <div className="workspace-heading chrome">
          <div><div className="eyebrow mb-4">CONNECT THE DOTS. CHECK THE SOURCE.</div><h1 className="intelligence-title">Company intelligence<span className="mint">.</span></h1><p className="page-description">Less noise. A clearer view of the companies that matter.</p></div>
          <div className="dataset-label"><Braces size={17} aria-hidden="true" /><div><span className="field-label">SOURCE COLLECTION</span><p>Supplied company records <span className="mono text-[#63F5BD]">/ 03</span></p></div></div>
        </div>

        <section aria-label="Search and comparison controls" className="command-bar chrome">
          <div className="search-box">
            <Search size={21} aria-hidden="true" />
            <label htmlFor="company-search" className="sr-only">Search company names and summaries</label>
            <input ref={searchRef} id="company-search" value={query} autoComplete="off" spellCheck={false} placeholder="Search companies, keywords…  Ctrl + K" onChange={event => {
              const next = event.target.value;
              if (!next && query) { setQuery(next); briefLoad(); }
              else { setQuery(next); }
            }} />
            {query && <button className="icon-button search-clear" type="button" aria-label="Clear search" onClick={clearSearch}><X size={16} aria-hidden="true" /></button>}
            <button type="button" className="command-shortcut mono" aria-label="Open command palette (Control or Command K)" aria-keyshortcuts="Control+k Meta+k" onClick={() => setCommandOpen(true)}>Ctrl + K</button>
          </div>
          <div className="compare-control">
            <Layers2 size={17} aria-hidden="true" /><span id="compare-label">Compare</span>
            <button role="switch" aria-checked={compareMode} aria-labelledby="compare-label" className={`compare-switch ${compareMode ? "is-on" : "is-off"}`} onClick={toggleCompare}><span /></button>
          </div>
        </section>

        <AnimatePresence initial={false}>
          {compareMode && <motion.section className="selection-panel chrome" aria-label="Comparison selection" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="selection-content"><div className="selection-copy"><Layers2 size={17} className="mint" aria-hidden="true" /><span>{selected.length === 2 ? "Ready to compare" : "Select two companies"}</span><span className="selection-count mono">{selected.length} / 2</span></div>
              <div className="selected-chips">{selectedCompanies.map(c => <button type="button" className="selection-chip" key={c.company_name} aria-label={`Remove ${c.company_name} from comparison`} onClick={() => select(c)}>{c.company_name}<X size={12} aria-hidden="true" /></button>)}</div>
              <button type="button" className="action-button primary-action" disabled={selected.length !== 2 || loading} onClick={() => setCompareOpen(true)}>Compare companies <ArrowRight size={15} aria-hidden="true" /></button></div>
            <p className="selection-help">{selected.length === 2 ? "Two selected. Remove one to choose another company." : "Compare source-backed fields and spot differences, side by side."}</p>
          </motion.section>}
        </AnimatePresence>

        <div className="results-toolbar chrome"><div className="flex items-center gap-3"><h2>Company directory</h2><span className="count-badge mono">{String(visible.length).padStart(2, "0")}</span></div><span className="directory-note"><ArrowDownUp size={13} aria-hidden="true" /> Original record order</span></div>
        <p className="sr-only" role="status" aria-live="polite">{loading ? "Preparing company records" : `${visible.length} ${visible.length === 1 ? "company" : "companies"} found.${compareMode ? ` ${selected.length} of 2 selected for comparison.` : ""}`}</p>

        <div className={`main-data-container ${bootState === "running" ? "boot-sequence" : ""}`} onAnimationEnd={event => {
          if (event.animationName === "signalpost-boot" && event.target === event.currentTarget) setBootState("finished");
        }} aria-busy={loading}>
          {loading ? <SkeletonCards /> : <div className="company-grid">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((company) => {
                const picked = selected.includes(company.company_name);
                const social = !isMissingValue(company.social_media_pages);
                const originalIndex = companies.indexOf(company);
                return <motion.article layout key={company.company_name} className={`company-card ${picked ? "is-selected" : ""}`} initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .95 }} transition={{ duration: reduced ? 0 : .22, layout: { duration: reduced ? 0 : .28 } }} aria-labelledby={`company-${originalIndex}`}>
                  <div className="card-topline"><div className="company-icon"><Building2 size={22} strokeWidth={1.4} aria-hidden="true" /></div><div className="flex items-center gap-2"><span className="record-id mono">REC / {String(originalIndex + 1).padStart(3, "0")}</span>{compareMode && <button type="button" aria-label={`${picked ? "Deselect" : "Select"} ${company.company_name} for comparison`} aria-pressed={picked} disabled={!picked && selected.length === 2} className={`select-company ${picked ? "is-selected" : ""}`} onClick={() => select(company)}>{picked ? <Check size={14} aria-hidden="true" /> : <span />}</button>}</div></div>
                  <div className="company-title-row"><h3 id={`company-${originalIndex}`}><button className="company-title" type="button" onClick={() => openProfile(company)}><HighlightMatch text={company.company_name} query={query} /></button></h3><SourceButton company={company} field="company_name" onTrace={openTrace} /></div>
                  <div className="card-summary"><div className="field-heading"><span className="field-label">INTELLIGENCE SUMMARY</span><SourceButton company={company} field="one_paragraph_summary" onTrace={openTrace} /></div><p className="data-value summary-value"><HighlightMatch text={company.one_paragraph_summary} query={query} /></p></div>
                  <dl className="card-fields">
                    <div className="card-field"><dt><Globe2 size={14} aria-hidden="true" />Website</dt><dd><a className="data-value trace-link" href={company.official_website} target="_blank" rel="noopener noreferrer">{company.official_website.replace("https://", "")}</a><SourceButton company={company} field="official_website" onTrace={openTrace} /></dd></div>
                    <div className="card-field"><dt><Link2 size={14} aria-hidden="true" />Social media</dt><dd>{social ? <a className="data-value trace-link" href={company.social_media_pages} target="_blank" rel="noopener noreferrer">{company.social_media_pages.includes("linkedin") ? "LinkedIn" : "Twitter"}<ArrowRight size={12} aria-hidden="true" /></a> : <RedactedBadge />}<SourceButton company={company} field="social_media_pages" onTrace={openTrace} /></dd></div>
                    <div className="card-field"><dt><Newspaper size={14} aria-hidden="true" />News mentions</dt><dd><span className={company.mentions_company_name_in_news ? "news-present" : "muted-value"}>{company.mentions_company_name_in_news ? <><span className="status-dot" />Mention reported</> : "None reported"}</span><SourceButton company={company} field="mentions_company_name_in_news" onTrace={openTrace} /></dd></div>
                  </dl>
                  <div className="card-footer"><span className="mono"><CircleDot size={11} aria-hidden="true" />JSON SOURCE</span><button type="button" className="open-profile" onClick={() => openProfile(company)} aria-label={`Open ${company.company_name} profile`}>View profile <ArrowRight size={15} aria-hidden="true" /></button></div>
                </motion.article>;
              })}
            </AnimatePresence>
          </div>}
          {!loading && visible.length === 0 && <div className="empty-state"><Search size={28} aria-hidden="true" /><h3>No matching signals</h3><p>Try a company name or a word from its summary.</p><button type="button" className="action-button" onClick={clearSearch}>Clear search <X size={14} aria-hidden="true" /></button></div>}
        </div>

        <div className="provenance-note chrome"><ShieldCheck size={17} aria-hidden="true" /><p><strong>Traceable by design.</strong> Use any <span className="inline-info">i</span> icon to inspect the original JSON field. Source matches are not independent fact-checks. Redacted means no value was supplied.</p><span className="mono provenance-type">SUPPLIED DATA · READ ONLY</span></div>
        <footer className="workspace-footer chrome"><span>Signalpost Intelligence <span className="footer-slash">/</span> A clearer signal.</span><LiveTelemetry /></footer>
      </main>

      <CompanyProfile company={profile} open={profileOpen} onOpenChange={setProfileOpen} onTrace={openTrace} onMockAction={mockAction} />
      {selectedCompanies.length === 2 && <CompareView companies={selectedCompanies as [Company, Company]} open={compareOpen} onOpenChange={setCompareOpen} onTrace={openTrace} />}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} query={query} onQueryChange={setQuery} matches={visible} onTrace={openTrace} />
      <VerificationTrace target={trace} open={traceOpen} onOpenChange={setTraceOpen} />
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="true"><AnimatePresence>{toast && <motion.div key={toast.id} className="toast" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}><span className="toast-check"><CheckCheck size={18} aria-hidden="true" /></span><div><span className="toast-message">{toast.message}</span><span className="toast-context">Demo action · no file or clipboard change</span></div><button className="icon-button" type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={15} aria-hidden="true" /></button></motion.div>}</AnimatePresence></div>
    </div>
  </MotionConfig>;
}
