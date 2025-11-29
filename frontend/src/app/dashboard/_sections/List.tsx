"use client";

import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Item } from "./Item";
import { Project } from "@/types";

interface ListProps {
  projects: Project[];
  selectedProject: Project | null;
  search: string;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onStart: (project: Project) => void;
  setSearch: (search: string) => void;
}

export const List = ({
  projects,
  selectedProject,
  search,
  onSelect,
  onCreate,
  onStart,
  setSearch,
}: ListProps) => {
  return (
    <div className="w-80 flex flex-col bg-gray-09 border-r border-white/20">
      <div className="relative text-gray-400">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/10 px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/60"
        />
        <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-2.5 pointer-events-none text-white/80" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 && (
          <p className="text-gray-400 text-center mt-6">No projects found.</p>
        )}
        {projects.map((project) => (
          <Item
            key={project.id}
            project={project}
            isSelected={selectedProject?.id === project.id}
            onSelect={onSelect}
            onStart={onStart}
          />
        ))}
      </div>
      <button
        onClick={onCreate}
        className="w-full flex justify-center items-center gap-2 bg-white/10 hover:bg-white/30 hover:cursor-pointer py-2 text-white transition-colors text-sm"
      >
        <PlusIcon className="w-5 h-5" />
        New Project
      </button>
    </div>
  );
};
