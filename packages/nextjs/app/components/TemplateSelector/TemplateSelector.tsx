"use client";

import {
  PRESET_SCHEDULE_ITEMS,
  type ScheduleTemplate,
} from "../../template-types";

type TemplateSelectorProps = {
  value: string;
  templates: ScheduleTemplate[];
  onChange: (templateId: string) => void;
};

export function TemplateSelector({
  value,
  templates,
  onChange,
}: TemplateSelectorProps) {
  return (
    <div className="card-instrument p-5 animate-fade-up">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-mono text-primary tracking-widest uppercase">
          Quick Select
        </span>
      </div>
      <select
        className="select select-bordered w-full font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Select a template —</option>
        <optgroup label="Preset Templates">
          {PRESET_SCHEDULE_ITEMS.map((item, i) => (
            <option key={`preset-${i}`} value={`preset-${i}`}>
              {item.name} ({item.amount}, {item.curve})
            </option>
          ))}
        </optgroup>
        {templates.length > 0 && (
          <optgroup label="My Templates">
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.items[0]?.amount}, {t.items[0]?.curve})
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
