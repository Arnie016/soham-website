"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
const GuidePanel = dynamic(() => import("./portfolio-guide-panel"), {
  ssr: false,
  loading: () => (
    <span className="guide-loading" role="status">
      Opening portfolio guide…
    </span>
  ),
});
export function PortfolioGuide() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  if (/^\/(portal|studio|login|activate)(\/|$)/.test(path)) return null;
  return (
    <>
      <button
        className="guide-launch"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <MessageCircle size={19} />
        <span>Ask about the work</span>
      </button>
      {open && (
        <GuidePanel
          onClose={() => setOpen(false)}
          project={path.startsWith("/work/") ? path.split("/")[2] : null}
        />
      )}
    </>
  );
}
