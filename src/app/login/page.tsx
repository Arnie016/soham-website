import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/site-shell";
import { LoginForm } from "@/components/auth-forms";
import { ThreeStudy } from "@/components/three-study";
import { sessionUser } from "@/server/auth";
import { usesEmailOnly } from "@/server/backend";
import { GMAIL_COMPOSE } from "@/lib/contact";
export const metadata = {
  title: "Client sign-in",
  robots: { index: false, follow: false },
};
export default async function Login() {
  const user = await sessionUser();
  if (user) redirect(user.role === "architect" ? "/studio" : "/portal");
  return (
    <>
      <Header />
      <main id="main" className="auth-page">
        <div className="auth-art">
          <span className="eyebrow">A SHARED DRAWING BOARD</span>
          <h1>
            Your space.
            <br />
            <em>Taking shape.</em>
          </h1>
          <ThreeStudy decorative />
        </div>
        <div className="auth-form">
          <span className="eyebrow">CLIENT & STUDIO WORKSPACE</span>
          {usesEmailOnly() ? (
            <>
              <h2>Your workspace is being prepared.</h2>
              <p>
                For project drawings, updates or a conversation about your
                space, contact Soham directly.
              </p>
              <a
                className="button"
                href={GMAIL_COMPOSE}
                target="_blank"
                rel="noopener noreferrer"
              >
                Email Soham
              </a>
            </>
          ) : (
            <>
              <h2>Welcome back.</h2>
              <p>
                Sign in for your project’s drawings, updates and conversations.
              </p>
              <LoginForm />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
