import Link from "next/link";
import { ArrowLeft, Radar } from "lucide-react";

export default function NotFound() {
  return <main className="not-found"><Radar size={36} className="mint" aria-hidden="true" /><p className="eyebrow">404 / SIGNAL NOT FOUND</p><h1>This signal is out of range.</h1><p>The page you’re looking for isn’t in this workspace.</p><Link href="/" className="action-button"><ArrowLeft size={16} aria-hidden="true" />Return to company intelligence</Link></main>;
}
