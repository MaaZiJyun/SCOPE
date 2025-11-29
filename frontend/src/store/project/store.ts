"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Project } from "@/types";
import { filterProjects } from "./utils";

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  searchContent: string;
  filteredProjects: Project[];

  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  setSearchContent: (search: string) => void;
  createProject: (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => void;
  updateProject: (updated: Project) => void;
  deleteProject: (id: string) => void;
}

export const useProjectsStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
        projects: [],
        selectedProject: null,
        searchContent: "",
        filteredProjects: [],

        setProjects: (projects) =>
          set((state) => ({
            projects,
            filteredProjects: filterProjects(projects, state.searchContent),
          })),

        setSelectedProject: (project) => set({ selectedProject: project }),

        setSearchContent: (search) =>
          set((state) => ({
            searchContent: search,
            filteredProjects: filterProjects(state.projects, search),
          })),

        createProject: (data) => {
          const newProject: Project = {
            ...data,
            id: "",
          };
          const updatedList = [...get().projects, newProject];
          set({
            projects: updatedList,
            selectedProject: newProject,
            filteredProjects: filterProjects(updatedList, get().searchContent),
          });
        },

        updateProject: (updated) => {
          const updatedProject = {
            ...updated,
          };
          const updatedList = get().projects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          );
          set({
            projects: updatedList,
            selectedProject: updatedProject,
            filteredProjects: filterProjects(updatedList, get().searchContent),
          });
        },

        deleteProject: (id) => {
          if (!window.confirm("Are you sure to delete this project?")) return;
          const filtered = get().projects.filter((p) => p.id !== id);
          set({
            projects: filtered,
            selectedProject:
              get().selectedProject?.id === id ? filtered[0] || null : get().selectedProject,
            filteredProjects: filterProjects(filtered, get().searchContent),
          });
        },
      }),
      {
        name: "projects-store",
        partialize: (state) => {
          // Omit large fields from selectedProject before persisting
          const sanitizedSelectedProject = state.selectedProject
            ? {
              ...state.selectedProject,
              satellites: undefined,
              roi: undefined,
              imagery: undefined,
              groundstation: undefined,
            }
            : null;

          return {
            ...state,
            selectedProject: sanitizedSelectedProject,
          };
        },
      }
    )
  )
);
