"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  type ScheduleTemplate,
  PRESET_SCHEDULE_ITEMS,
  loadTemplates,
} from "../../template-types";
import { EmptyState } from "../SchedulesSection/index";
import { BlueprintCard } from "./BlueprintCard";
import { ExportModal } from "./ExportModal";

export function TemplatesSection() {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const handleExport = () => {
    const data = JSON.stringify(templates, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chronoplan-templates-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Templates exported");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(
          e.target?.result as string,
        ) as ScheduleTemplate[];
        const existing = loadTemplates();
        const merged = [
          ...existing,
          ...imported.filter((i) => !existing.some((e) => e.id === i.id)),
        ];
        // Save to localStorage
        localStorage.setItem("chronoplan_templates", JSON.stringify(merged));
        setTemplates(merged);
        toast.success(`Imported ${imported.length} template(s)`);
      } catch {
        toast.error("Invalid template file");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Build list of all templates (presets + user templates)
  const allPresets = PRESET_SCHEDULE_ITEMS.map((item, i) => ({
    id: `preset-${i}`,
    name: item.name || `Preset ${i + 1}`,
    items: [item],
    createdAt: 0,
    updatedAt: 0,
    isPreset: true,
  }));

  const allUserTemplates = templates.map((t) => ({
    ...t,
    isPreset: false,
  }));

  const allTemplates = [...allPresets, ...allUserTemplates];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">Templates</h2>
          <p className="text-xs font-mono text-base-content/40 mt-1">
            {templates.length} custom template
            {templates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="btn btn-ghost btn-sm font-mono text-xs cursor-pointer">
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            className="btn btn-ghost btn-sm font-mono text-xs"
            onClick={() => setShowExport(true)}
          >
            Export
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {allTemplates.length === 0 ? (
        <EmptyState
          icon="◇"
          title="No templates yet"
          desc="Templates are saved when you deploy schedules"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTemplates.map((template) => (
            <BlueprintCard
              key={template.id}
              template={template}
              onEdit={() => {}}
              onDelete={() => {}}
              canDelete={false}
            />
          ))}
        </div>
      )}

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          templates={templates}
          onClose={() => setShowExport(false)}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
