import { redirect } from "next/navigation";
import { sessionUser } from "@/server/auth";
import { Workspace } from "@/components/workspace";
export const metadata = {
  title: "Studio workspace",
  robots: { index: false, follow: false },
};
export default async function Studio({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await sessionUser();
  if (!user) redirect("/login");
  if (user.role !== "architect") redirect("/portal");
  const { tab } = await searchParams;
  return <Workspace user={user} tab={tab || "projects"} />;
}
