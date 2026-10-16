import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { WorkLogsView } from "@/components/features/worklogs/WorkLogsView";

export default async function WorkLogsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  }).catch(() => null);

  if (!currentUser) {
    redirect("/login");
  }

  const permissions = currentUser.permissions || "";
  const permList = permissions.split(",").map((p: string) => p.trim());
  const hasAccess = currentUser.role === "admin" || currentUser.role === "super_admin" || currentUser.role === "tutor" || permList.includes("view_worklogs");

  let logs: any[] = [];
  let users: any[] = [];

  if (hasAccess) {
    [logs, users] = await Promise.all([
      prisma.workLog.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
      prisma.user.findMany({
        where: { role: "intern" },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" }
      }).catch(() => [])
    ]);
  } else {
    // Securely query only the logs belonging to the authenticated user
    logs = await prisma.workLog.findMany({
      where: { email: currentUser.email },
      orderBy: { createdAt: "desc" }
    }).catch(() => []);
    
    users = [{
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role
    }];
  }

  return (
    <div className="page-stack">
      <WorkLogsView initialLogs={logs as any} users={users} />
    </div>
  );
}
