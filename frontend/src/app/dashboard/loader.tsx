// app/dashboard/DashboardLoader.tsx
"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types";
import { useAuthStore } from "@/store/userStore";
import Dashboard from "./Dashboard";
import LoadingPage from "@/components/LoadingPage";
import ErrorPage from "@/components/Error";

export async function loadDashboardData(userId: string): Promise<Project[]> {
  // const res = await fetch(`/api/project/list/${userId}`, { cache: "no-store" });
  const res = await fetch(`/api/local-project/list`, { cache: "no-store" });
  const json = await res.json();
  if (json.status === "success") return json.data;
  throw new Error(json.detail || json.error || "加载项目失败");
  // return [];
}

export default function DashboardLoader() {
  const { userInfo } = useAuthStore();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userInfo?.id) return;

    setLoading(true);
    setError(null);

    loadDashboardData(userInfo.id)
      .then((data) => setProjectList(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userInfo?.id]);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage message={`加载项目失败: ${error}`} />;

  return <Dashboard projectList={projectList ?? []} />;
}
