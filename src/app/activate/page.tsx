import { Header } from "@/components/site-shell";
import { ActivationForm } from "@/components/auth-forms";
import { redirect } from "next/navigation";
import { usesEmailOnly } from "@/server/backend";
export const metadata = {
  title: "Set up your workspace",
  robots: { index: false, follow: false },
};
export default function Activate() {
  if (usesEmailOnly()) redirect("/login");
  return (
    <>
      <Header />
      <main id="main" className="section activation-page">
        <span className="eyebrow">YOUR INVITATION</span>
        <h1>
          A place for
          <br />
          <em>your project.</em>
        </h1>
        <div className="auth-form">
          <ActivationForm />
        </div>
      </main>
    </>
  );
}
