"use client";
import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/userStore";

// 白名单路径
const PUBLIC_PATHS = ["/", "/login", "/register"];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isPublic && !userInfo) {
      router.replace("/");
    }
  }, [userInfo, isPublic, router, hasHydrated]);

  if (!hasHydrated) return null;

  if (!isPublic && !userInfo) return null;

  return <>{children}</>;
}
