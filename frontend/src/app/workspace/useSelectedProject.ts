// features/workspace/hooks/useProjects.ts
import { useState, useCallback } from "react";
import { Project } from "@/types";

export function useSelectedProject
  (selected: Project | null) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(selected);
  const [searchContent, setSearchContent] = useState("");

  const updateProject = (updated: Project) => {
    setSelectedProject(updated);
  };

  return {
    selectedProject,
    setSelectedProject,
    searchContent,
    setSearchContent,
    updateProject,
  };
}
