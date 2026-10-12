"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="section empty-page">
      <span className="eyebrow">CONNECTION INTERRUPTED</span>
      <h1>
        Let’s try <em>again.</em>
      </h1>
      <p>This page could not load. Retry, or contact Soham directly.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <a className="text-link" href="mailto:sohamkhetan@gmail.com">
        Email Soham
      </a>
    </main>
  );
}
