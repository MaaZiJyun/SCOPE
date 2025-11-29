"use client";

import { Project } from "@/types";
import { BlurUpdateInput } from "../../../components/BlurUpdateInput";


interface ProjectDetailsProps {
  form: Project;
  updateField: (path: string[], value: any) => void;
}

export const ProjectDetails = ({ form, updateField }: ProjectDetailsProps) => {
  return (
    <div className="mt-4 mb-8 mx-20">
      <div className="mb-2">
        <span className="text-xl">Basic</span>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block mb-1 text-xs">Title {form.id && `(ID: ${form.id})`}</label>
        <BlurUpdateInput
          value={form.title}
          onSave={(val) => updateField(["title"], val)}
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block mb-1 text-xs">Description</label>
        <textarea
          rows={3}
          defaultValue={form.description}
          onBlur={(e) =>
            updateField(["description"], e.target.value || undefined)
          }
          className="w-full rounded bg-white/20 px-3 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
          placeholder="Enter project description"
        />
      </div>
    </div>
  );
};
