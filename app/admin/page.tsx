import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { getAdminState } from "@/lib/server-store";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminToken(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value
  );

  if (!session) {
    redirect("/admin/login");
  }

  const initialState = getAdminState();

  return (
    <AdminDashboard
      initialState={initialState}
      adminUsername={session.username}
    />
  );
}
