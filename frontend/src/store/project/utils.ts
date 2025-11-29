import { Project } from "@/types";

export const filterProjects = (projects: Project[], search: string): Project[] => {
  const s = search.toLowerCase();
  return projects.filter(
    (p) =>
      p.title.toLowerCase().includes(s) ||
      (p.constellation.name || "").toLowerCase().includes(s)
  );
};
