"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/types";
import Earth from "@/components/Earth";
import { useProjects } from "./useProjects";
import { List } from "@/app/dashboard/_sections/List";
import Demo from "@/app/dashboard/_sections/Demo";
import { OuterEditer } from "@/app/_project_config/PopupProjectConfig";

export default function Dashboard({ projectList }: { projectList: Project[] }) {
  const {
    projects,
    setProjects,
    selectedProject,
    setSelectedProject,
    searchContent,
    setSearchContent,
    filteredProjects,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects(projectList);

  const [modalVisible, setModalVisible] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const router = useRouter();

  useEffect(() => {
    setProjects(projectList);
  }, []);

  const openEditModal = (project: Project | null) => {
    setSelectedProject(project);
    setEditProject(project);
    setModalVisible(true);
  };

  const saveProject = (project: Project) => {
    if (!project.id) {
      createProject(project);
    } else {
      updateProject(project);
    }
    setModalVisible(false);
  };

  const startProject = (project: Project) => {
    if (!project.id) {
      console.error("project.id is invalid:", project);
      return;
    }
    setSelectedProject(project);
    router.push(`/workspace?projectId=${encodeURIComponent(project.id)}`);
  };

  return (
    <div className="w-full h-screen bg-black text-gray-300 relative font-sans overflow-hidden">
      <Earth isFull={false} />
      <div className="absolute top-0 h-full w-full bg-black/50 backdrop-blur-sm rounded-lg z-20 flex flex-col">
        <div className="w-full h-full flex">
          <List
            projects={filteredProjects}
            selectedProject={selectedProject}
            onSelect={setSelectedProject}
            onEdit={openEditModal}
            onDelete={deleteProject}
            onCreate={() => openEditModal(null)}
            onStart={startProject}
            search={searchContent}
            setSearch={setSearchContent}
          />
          <Demo
            selectedProject={selectedProject}
            onEdit={openEditModal}
            onDelete={deleteProject}
          />
          <OuterEditer
            project={selectedProject}
            onSave={saveProject}
            onClose={() => setModalVisible(false)}
            isVisible={modalVisible}
          />
        </div>
      </div>
    </div>
  );
}
