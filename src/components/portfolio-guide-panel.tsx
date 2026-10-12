"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Send, X } from "lucide-react";
import type { GuideReply } from "@/lib/guide/knowledge";
type Turn = { question: string; reply: GuideReply };
export default function GuidePanel({
  onClose,
  project,
}: {
  onClose: () => void;
  project: string | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    bottom = useRef<HTMLDivElement>(null),
    latest = useRef<HTMLElement>(null),
    input = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState(""),
    [turns, setTurns] = useState<Turn[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const context = useRef(project),
    controller = useRef<AbortController | null>(null),
    inFlight = useRef(false);
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = old;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!busy && turns.length)
      latest.current?.scrollIntoView({ behavior: "instant", block: "start" });
    else if (busy || error)
      bottom.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
  }, [turns, busy, error]);
  async function ask(value: string) {
    if (inFlight.current || value.trim().length < 2) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setQuestion(value);
    const c = new AbortController();
    controller.current = c;
    const timeout = setTimeout(() => c.abort(), 10000);
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value, context: context.current }),
        signal: c.signal,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "The guide could not load. Try again.");
      context.current = data.context;
      setTurns((t) => [...t.slice(-9), { question: value, reply: data }]);
      setQuestion("");
    } catch (e) {
      if (c.signal.aborted)
        setError(
          "That took too long. Please try again, or open the projects directly.",
        );
      else
        setError(
          e instanceof TypeError
            ? "Couldn’t reach the portfolio guide. Your question is kept below. Try again."
            : e instanceof Error
              ? e.message
              : "Connection interrupted. Please try again.",
        );
    } finally {
      clearTimeout(timeout);
      inFlight.current = false;
      setBusy(false);
    }
  }
  const suggestions = turns.at(-1)?.reply.suggestions || [
    "What can Soham deliver for my home?",
    "Why is Prithvika sustainable?",
    "Show the original PDFs",
  ];
  return (
    <dialog
      className="guide-panel"
      ref={dialog}
      aria-labelledby="guide-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <div>
          <span>SOHAM KHETAN</span>
          <h2 id="guide-title">A closer look.</h2>
        </div>
        <button aria-label="Close portfolio guide" onClick={onClose}>
          <X size={22} />
        </button>
      </header>
      <div className="guide-conversation" aria-busy={busy}>
        <p className="guide-intro">
          Ask about the projects, materials or what Soham can help you create.
        </p>
        <p className="guide-note">
          Portfolio search, not a general AI chat. Answers link to the source.
          Your questions aren’t saved by the guide.
        </p>
        {!turns.length && (
          <a className="guide-feature" href="/work/prithvika">
            <img
              src="/portfolio-hd/thesis/page-01-800.webp"
              alt="Prithvika campus"
            />
            <span>
              Prithvika · Explore the thesis <ArrowUpRight size={16} />
            </span>
          </a>
        )}
        <div
          role="log"
          aria-label="Portfolio conversation"
          aria-live="polite"
          aria-relevant="additions"
        >
          {turns.map((t, i) => (
            <section
              className="guide-turn"
              key={i}
              ref={i === turns.length - 1 ? latest : undefined}
            >
              <p className="guide-question">{t.question}</p>
              <p>{t.reply.answer}</p>
              {t.reply.cards.map((card) => (
                <article key={card.id}>
                  {card.sources[0]?.image && (
                    <a href={card.sources[0].href}>
                      <img
                        className="guide-result-image"
                        src={card.sources[0].image}
                        alt={card.title}
                        loading="lazy"
                      />
                    </a>
                  )}
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <div className="guide-sources">
                    {card.sources.map((s) => (
                      <a
                        key={s.href}
                        href={s.href}
                        target={
                          s.href.includes(".pdf") || s.href.includes(".webp")
                            ? "_blank"
                            : undefined
                        }
                        rel="noopener noreferrer"
                      >
                        {s.title}
                        <ArrowUpRight size={14} />
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>
        {busy && <p role="status">Finding relevant portfolio pages…</p>}
        {error && (
          <p role="alert" className="guide-error">
            {error} <a href="/work">Browse projects</a>
          </p>
        )}
        <div className="guide-suggestions">
          {suggestions.map((s) => (
            <button disabled={busy} key={s} onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
        <div ref={bottom} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <label className="sr-only" htmlFor="guide-question">
          Ask about Soham’s work
        </label>
        <input
          id="guide-question"
          ref={input}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={600}
          minLength={2}
          required
          placeholder="Ask about a project…"
          autoComplete="off"
        />
        <button
          aria-label="Send question"
          disabled={busy || question.trim().length < 2}
        >
          <Send size={19} />
        </button>
      </form>
      <footer>
        <a href="/contact">
          Discuss your own project <ArrowUpRight size={14} />
        </a>
        <button
          onClick={() => {
            setTurns([]);
            context.current = project;
            setError("");
          }}
          disabled={busy || !turns.length}
        >
          Clear chat
        </button>
      </footer>
    </dialog>
  );
}
