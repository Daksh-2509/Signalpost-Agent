"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export type BootSequenceProps = {
  onFinish: (playGlitch: boolean) => void;
  onReveal: () => void;
};

const BOOT_STORAGE_KEY = "signalpost_booted";
const bootLines = [
  "SIGNALPOST_OS // FAKEDOS v5.02 RELEASE (x86_64)",
  "BIOS DATE: 04/11/98 14:22:05 VER: 08.00.12",
  "CPU: QUANTUM SYNTHESIZER @ 133MHz // BUS CLK: 66MHz",
  "CHECKING NVRAM... 640KB BASE MEMORY OK",
  "EXTENDED MEMORY TEST: 32768KB OK (PAGE MODE ENABLED)",
  "INITIALIZING DMA CONTROLLERS & IRQ ROUTING... [OK]",
  "IDE CHANNEL 0 MASTER: QUANTUM FIREBALL 1.2GB... DETECTED",
  "MOUNTING DRIVE C:\\ (FAT16)... MOUNTED",
  "LOADING CONFIG.SYS & AUTOEXEC.BAT...",
  "DEVICE=HIMEM.SYS /TESTMEM:OFF",
  "INITIALIZING SECURE ENCLAVE PROXY... CONNECTED",
  "DECRYPTING CORPORATE RECORD CACHE... ACCESS GRANTED.",
] as const;

function rememberBoot() {
  document.documentElement.dataset.signalpostFakeDosBooted = "true";
  try { window.sessionStorage.setItem(BOOT_STORAGE_KEY, "true"); }
  catch { /* Storage can be disabled; the document/ref guards still allow entry. */ }
}

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function BootSequence({ onFinish, onReveal }: BootSequenceProps) {
  const [phase, setPhase] = useState<"waiting" | "running" | "fade">("waiting");
  const [lineCount, setLineCount] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const mountedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  const onRevealRef = useRef(onReveal);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const audioRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const detachListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onFinishRef.current = onFinish;
    onRevealRef.current = onReveal;
  }, [onFinish, onReveal]);

  const closeAudio = useCallback(() => {
    const oscillator = oscillatorRef.current;
    const context = audioRef.current;
    oscillatorRef.current = null;
    audioRef.current = null;
    if (oscillator) {
      oscillator.onended = null;
      try { oscillator.stop(); } catch { /* Already stopped or unavailable. */ }
      oscillator.disconnect();
    }
    if (context && context.state !== "closed") {
      try { void context.close().catch(() => {}); } catch { /* Audio is optional. */ }
    }
  }, []);

  const clearResources = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
    closeAudio();
    detachListenersRef.current?.();
    detachListenersRef.current = null;
  }, [closeAudio]);

  const finish = useCallback((playGlitch: boolean) => {
    if (finishedRef.current || !mountedRef.current) return;
    finishedRef.current = true;
    clearResources();
    rememberBoot();
    setBootComplete(true);
    setIsBooting(false);
    onFinishRef.current(playGlitch);
  }, [clearResources]);

  // These callbacks are stable; the storage check must only run on mount,
  // never in response to telemetry, query changes, props or console output.
  const finishRef = useRef(finish);
  const clearResourcesRef = useRef(clearResources);
  useEffect(() => {
    mountedRef.current = true;
    let alreadyBooted = document.documentElement.dataset.signalpostFakeDosBooted === "true";
    try { alreadyBooted = window.sessionStorage.getItem(BOOT_STORAGE_KEY) === "true" || alreadyBooted; }
    catch { /* Use the document fallback when sessionStorage is unavailable. */ }
    if (alreadyBooted) finishRef.current(false);
    else setSessionChecked(true);
    return () => {
      mountedRef.current = false;
      clearResourcesRef.current();
    };
  }, []);

  useEffect(() => {
    if (!sessionChecked || bootComplete) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    contentRef.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previousOverflow; };
  }, [sessionChecked, bootComplete]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lineCount]);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      if (mountedRef.current && !finishedRef.current) callback();
    }, delay);
    timersRef.current.add(timer);
  }, []);

  const playPostBeep = useCallback(() => {
    // Everything up to resume/start happens in the first actual user gesture.
    // Audio failures must never delay the independently scheduled console.
    try {
      const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      audioRef.current = context;
      if (context.state === "suspended") {
        void context.resume().catch(() => {
          if (audioRef.current === context) closeAudio();
        });
      }
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillatorRef.current = oscillator;
      oscillator.type = "sine";
      const start = context.currentTime;
      oscillator.frequency.setValueAtTime(800, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.04, start + 0.005);
      gain.gain.setValueAtTime(0.04, start + 0.135);
      gain.gain.linearRampToValueAtTime(0, start + 0.15);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => {
        gain.disconnect();
        if (audioRef.current === context) closeAudio();
      };
      oscillator.start(start);
      oscillator.stop(start + 0.15);
    } catch {
      closeAudio();
    }
  }, [closeAudio]);

  const initialize = useCallback(() => {
    if (!sessionChecked || bootComplete || isBooting || startedRef.current || finishedRef.current || !mountedRef.current) return;
    startedRef.current = true;
    setIsBooting(true);
    setPhase("running");
    playPostBeep();
    skipRef.current?.focus({ preventScroll: true });
    bootLines.forEach((_, index) => {
      schedule(() => setLineCount(index + 1), index * 200);
    });
    schedule(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finish(false);
        return;
      }
      // Persist before the dissolve too, so reload during handoff cannot restart POST.
      rememberBoot();
      // Both layers already exist in the DOM, so their transitions start together.
      onRevealRef.current();
      setPhase("fade");
      schedule(() => finish(true), 700);
    }, 2500);
  }, [sessionChecked, bootComplete, isBooting, finish, playPostBeep, schedule]);

  useEffect(() => {
    if (!sessionChecked || bootComplete || finishedRef.current) return;
    function isSkip(target: EventTarget | null) {
      return target instanceof Element && !!target.closest("[data-skip-boot]");
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" || (isSkip(event.target) && (event.key === "Enter" || event.key === " "))) {
        event.preventDefault();
        event.stopPropagation();
        finish(false);
        return;
      }
      if (event.key === "Tab" && startedRef.current && !finishedRef.current) {
        event.preventDefault();
        skipRef.current?.focus({ preventScroll: true });
        return;
      }
      if (startedRef.current || finishedRef.current || event.repeat || event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      initialize();
    }
    function onClick(event: MouseEvent) {
      if (isSkip(event.target) || startedRef.current || finishedRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      initialize();
    }
    window.addEventListener("keydown", onKey, true);
    if (phase === "waiting") window.addEventListener("click", onClick, true);
    const detach = () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("click", onClick, true);
    };
    detachListenersRef.current = detach;
    return () => {
      detach();
      if (detachListenersRef.current === detach) detachListenersRef.current = null;
    };
  }, [sessionChecked, bootComplete, phase, finish, initialize]);

  if (bootComplete) return null;

  return (
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        data-phase={phase}
        className="fakedos-overlay fixed inset-0 z-[100] flex min-w-0 items-center justify-center overflow-y-auto overscroll-contain bg-black p-6 font-mono text-[#63F5BD] sm:p-10"
      >
        <h2 id={titleId} className="sr-only">Signalpost system initialization</h2>
        <p id={descriptionId} className="sr-only">
          Press any key or click to play a brief startup tone and a simulated twelve-line BIOS check,
          followed by a smooth cinematic dissolve into the dashboard. Press Escape or choose Skip
          Boot at any time to open the dashboard immediately. Boot runs once per tab session.
          Reduced motion disables the animations.
        </p>
        <div className="fakedos-console min-w-0 max-w-full">
          <div className="fakedos-output">
          {!sessionChecked ? null : phase === "waiting" ? (
            <p className="fakedos-prompt">
              {"> PRESS ANY KEY (OR CLICK) TO INITIATE BOOT SEQUENCE <"}
            </p>
          ) : (
            <div
              ref={logRef}
              className="fakedos-lines max-w-full whitespace-pre-wrap text-xs [overflow-wrap:anywhere]"
              role="log"
              aria-label="Simulated boot console output"
              aria-live="polite"
              aria-atomic={false}
              aria-relevant="additions"
            >
              {bootLines.slice(0, lineCount).map(line => <p key={line}>{line}</p>)}
            </div>
          )}
          </div>
          <button ref={skipRef} data-skip-boot type="button" className="fakedos-skip" onClick={() => finish(false)}>
            <kbd aria-hidden="true">[ESC]</kbd> Skip Boot
          </button>
        </div>
      </div>
  );
}
