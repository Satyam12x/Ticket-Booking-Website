"use client";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import Loader from "./loader";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <Loader isLoading={true} />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}