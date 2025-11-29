// app/workspace/WorkspaceLoader.tsx
"use client";

import { useEffect, useState } from "react";
import Workspace from "./Workspace";
import { useAuthStore } from "@/store/userStore";
import LoadingPage from "@/components/LoadingPage";
import { Project } from "@/types";
import { RealtimeFramesProvider } from "./useFramesContext";
import ErrorPage from "@/components/Error";

export async function loadWorkspaceData(
  projectId: string
): Promise<Project> {
  const res = await fetch(`/api/local-project/get/${projectId}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (json.status === "success") {
    return json.data;
  }
  throw new Error(json.detail || json.error || "加载项目失败");
}

export default function WorkspaceLoader() {
  const { userInfo } = useAuthStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userInfo?.id) return;
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("projectId");
    if (!projectId) {
      setSelectedProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // loadWorkspaceData(userInfo.id, projectId)
    loadWorkspaceData(projectId)
      .then((data) => setSelectedProject(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userInfo?.id]);

  if (loading) return <LoadingPage />;

  // if (error) return <div style={{ color: "red" }}>加载项目失败: {error}</div>;
  if (error) return <ErrorPage message={`加载项目失败: ${error}`} />;
  if (!selectedProject) return <div>没有选中项目</div>;

  return (
    <RealtimeFramesProvider>
      <Workspace selected={selectedProject} />
    </RealtimeFramesProvider>
  );
}
