import { useState, useMemo, useCallback } from "react";
import { Project } from "@/types";

export function useProjects(initialProjects: Project[]) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchContent, setSearchContent] = useState("");

  const filterProjects = (projects: Project[], search: string): Project[] => {
    const s = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        (p.constellation?.name || "").toLowerCase().includes(s)
    );
  };

  const filteredProjects = useMemo(() => {
    return filterProjects(projects, searchContent);
  }, [projects, searchContent]);

  const createProject = useCallback(
    (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
      const newProject: Project = {
        ...data,
        id: "",
      };
      const updated = [...projects, newProject];
      setProjects(updated);
      setSelectedProject(newProject);
    },
    [projects]
  );

  const updateProject = useCallback(
    (updated: Project) => {
      const updatedProject = {
        ...updated,
      };
      const updatedList = projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p
      );
      setProjects(updatedList);
      setSelectedProject(updatedProject);
    },
    [projects]
  );

  const deleteProject = useCallback(
    (id: string) => {
      if (!window.confirm("Are you sure to delete this project?")) return;
      const filtered = projects.filter((p) => p.id !== id);
      setProjects(filtered);
      setSelectedProject((prev) =>
        prev?.id === id ? filtered[0] || null : prev
      );
    },
    [projects]
  );

  return {
    projects,
    selectedProject,
    searchContent,
    filteredProjects,
    setProjects,
    setSelectedProject,
    setSearchContent,
    createProject,
    updateProject,
    deleteProject,
  };
}
