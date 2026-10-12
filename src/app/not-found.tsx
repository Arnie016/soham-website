import Link from "next/link";
import { Header, Footer } from "@/components/site-shell";
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="section empty-page">
        <span className="eyebrow">PAGE NOT FOUND</span>
        <h1>
          A different
          <br />
          <em>way through.</em>
        </h1>
        <p>
          This page may have moved, or the project is not available to your
          account.
        </p>
        <Link className="button" href="/">
          Return to the studio
        </Link>
      </main>
      <Footer />
    </>
  );
}
