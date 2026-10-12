import type { Metadata } from "next";
import "./globals.css";
import "./spatial.css";
import "./study.css";
import "./sustainability.css";
import "./experience.css";
import { PortfolioGuide } from "@/components/portfolio-guide";
export const metadata: Metadata = {
  title: {
    default: "Soham Khetan | Architecture, Interiors & Visualisation",
    template: "%s | Soham Khetan",
  },
  description:
    "Architecture, interiors, renovation, 3D visualisation and concept development with Soham Khetan, based in Chandrapur, Maharashtra.",
  robots: { index: !!process.env.APP_URL?.startsWith("https:"), follow: true },
  openGraph: {
    title: "Soham Khetan · Space to feel",
    description: "Architecture, interiors and ideas made visible.",
    images: ["/portfolio/thesis/page-01.jpg"],
  },
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3100"),
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <PortfolioGuide />
      </body>
    </html>
  );
}
