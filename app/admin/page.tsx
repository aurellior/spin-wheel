import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { getAdminState } from "@/lib/server-store";

async function AdminGate() {
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

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
          Memuat Admin Control Panel...
        </div>
      }
    >
      <AdminGate />
    </Suspense>
  );
}
