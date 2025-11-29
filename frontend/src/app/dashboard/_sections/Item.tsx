import { Project } from "@/types";
import { PlayIcon } from "@heroicons/react/24/outline";

interface ItemProps {
  project: Project;
  isSelected: boolean;
  onSelect: (project: Project) => void;
  onStart: (project: Project) => void;
}

export const Item = ({ project, isSelected, onSelect, onStart: onStart }: ItemProps) => {
  return (
    <div
      onClick={() => onSelect(project)}
      className={`px-3 py-2 flex justify-between items-center text-gray-300 ${
        isSelected ? "bg-white/20 text-white" : "hover:bg-white/10"
      }`}
    >
      <div className="flex flex-col">
        <div className="text-sm">{project.title}</div>
        <div className="text-xs text-gray-500">{project.constellation.name}</div>
      </div>
      <div className="flex gap-2 items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStart(project);
          }}
          title="Edit Project"
          className="text-white/80 hover:text-green-400"
        >
          <PlayIcon className="w-5 h-5 hover:cursor-pointer transition-colors" />
        </button>
      </div>
    </div>
  );
};