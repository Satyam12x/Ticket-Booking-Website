"use client";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import Loader from "./loader";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, isLoading, checkAdmin } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminCheckLoading, setAdminCheckLoading] = useState(requireAdmin);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!user || !requireAdmin) {
        setAdminCheckLoading(false);
        return;
      }
      const adminStatus = await checkAdmin();
      setIsAdmin(adminStatus);
      setAdminCheckLoading(false);
    };

    if (!isLoading) {
      verifyAdmin();
    }
  }, [user, isLoading, requireAdmin, checkAdmin]);

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("Redirecting to login: No user authenticated");
      router.push("/login");
    } else if (!isLoading && requireAdmin && !adminCheckLoading && !isAdmin) {
      console.log("Redirecting to login: User is not admin");
      router.push("/login");
    }
  }, [user, isLoading, isAdmin, adminCheckLoading, requireAdmin, router]);

  if (isLoading || adminCheckLoading) {
    return <Loader isLoading={true} />;
  }

  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}