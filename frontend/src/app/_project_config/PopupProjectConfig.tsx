import { Project } from "@/types";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ProjectConfig } from "./ProjectConfig";
import { createInitialProject } from "@/lib/InitialForm";

interface OuterEditerProps {
  project: Project | null;
  isVisible: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
}

export const OuterEditer = ({
  project,
  isVisible,
  onClose,
  onSave,
}: OuterEditerProps) => {
  if (!project) project = createInitialProject();
  return (
    <>
      {isVisible && (
        <div className="fixed inset-0 flex justify-center items-center z-50">
          <div className="relative bg-black rounded-lg w-full max-w-4xl max-h-[60vh] overflow-y-auto border border-white/30">
            <div className="flex justify-end items-center">
              <button
                onClick={onClose}
                title="Close"
                className="absolute top-0 text-white/80 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-8 h-8 hover:cursor-pointer" />
              </button>
            </div>
            {project ? (
              <ProjectConfig project={project} onSave={onSave} />
            ) : (
              <></>
            )}
          </div>
        </div>
      )}
    </>
  );
};
