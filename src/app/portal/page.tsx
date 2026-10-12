import { redirect } from "next/navigation";
import { sessionUser } from "@/server/auth";
import { Workspace } from "@/components/workspace";
export const metadata = {
  title: "Your projects",
  robots: { index: false, follow: false },
};
export default async function Portal() {
  const user = await sessionUser();
  if (!user) redirect("/login");
  if (user.role === "architect") redirect("/studio");
  return <Workspace user={user} tab="projects" />;
}
