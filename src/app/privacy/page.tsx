import { Header, Footer } from "@/components/site-shell";
export const metadata = { title: "Your details" };
export default function Privacy() {
  return (
    <>
      <Header />
      <main id="main" className="section prose-page">
        <span className="eyebrow">YOUR DETAILS</span>
        <h1>
          A note on <em>privacy.</em>
        </h1>
        <h2>Project enquiries</h2>
        <p>
          The enquiry form asks for your contact details and a short project
          brief. These details are passed to FormSubmit, our email delivery
          service, for forwarding to sohamkhetan@gmail.com so Soham can review
          and discuss your project. When the project workspace is enabled,
          enquiries are also saved in the studio's private database. Please
          avoid sending identity documents, financial records or other sensitive
          personal information through this form.
        </p>
        <h2>Portfolio guide</h2>
        <p>
          The guide searches public portfolio content. Your question and current
          project context are sent to this website to find relevant pages, not
          to an external AI provider. The guide does not store conversations in
          a database; the visible conversation clears when you close it. Please
          do not include private project documents or sensitive personal
          information. Standard hosting request logs may still be processed by
          the hosting provider.
        </p>
        <h2>Your project workspace</h2>
        <p>
          Client workspaces require an invitation and a password. A client can
          access their assigned projects, drawings and conversations. Soham has
          studio access to manage those projects. An essential sign-in cookie
          keeps you signed in until you sign out or your session expires. The
          configured backend uses Supabase Auth, a private database and
          access-controlled file storage for this workspace.
        </p>
        <h2>Questions and requests</h2>
        <p>
          For questions about your information, or to request a correction or
          deletion, contact{" "}
          <a href="mailto:sohamkhetan@gmail.com">sohamkhetan@gmail.com</a>.
        </p>
      </main>
      <Footer />
    </>
  );
}
