import { redirect, notFound } from "next/navigation";
import { sessionUser } from "@/server/auth";
import { ownProject } from "@/server/repository";
import { ProjectWorkspace } from "@/components/workspace";
export const metadata = {
  title: "Studio project",
  robots: { index: false, follow: false },
};
export default async function Project({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await sessionUser();
  if (!user) redirect("/login");
  if (user.role !== "architect") redirect("/portal");
  const { id } = await params;
  try {
    await ownProject(id, user);
  } catch {
    notFound();
  }
  return <ProjectWorkspace user={user} id={id} />;
}
