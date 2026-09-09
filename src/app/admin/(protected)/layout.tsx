"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/useAdminAuth";
import AdminNav from "@/components/admin/AdminNav";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="admin-loading">Cargando…</div>;
  }

  return (
    <>
      <AdminNav email={user.email ?? ""} />
      <main className="admin-main">{children}</main>
    </>
  );
}
