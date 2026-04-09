import { create } from "zustand";
import type { ScheduleTemplate } from "../template-types";

type TemplateStore = {
  appliedTemplate: ScheduleTemplate | null;
  setAppliedTemplate: (template: ScheduleTemplate | null) => void;
};

export const useTemplateStore = create<TemplateStore>((set) => ({
  appliedTemplate: null,
  setAppliedTemplate: (template) => set({ appliedTemplate: template }),
}));
