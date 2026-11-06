"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";

// One shared primitive gives nested profile/compare/trace layers the same
// focus scope, topmost Escape handling, scroll lock and return-focus behavior.
export function SignalModal({ open, onOpenChange, title, description, children, kind = "profile", eyebrow }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  kind?: "profile" | "compare" | "trace";
  eyebrow?: string;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={`modal-content modal-${kind}`} onOpenAutoFocus={() => {
          returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }} onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
        }}>
          <div className="modal-topbar">
            <div className="min-w-0">
              {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
              <Dialog.Title className="modal-title">{title}</Dialog.Title>
              <Dialog.Description className="modal-description">{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button shrink-0" aria-label={`Close ${kind === "trace" ? "Verification Trace" : kind === "compare" ? "comparison" : "company profile"}`}>
              <X size={19} aria-hidden="true" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
