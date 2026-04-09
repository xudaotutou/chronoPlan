export function TabIcon({ tab, active }: { tab: string; active: boolean }) {
  const icons: Record<string, { default: string; active: string }> = {
    create: { default: "→", active: "→" },
    templates: { default: "◇", active: "◆" },
    plans: { default: "◈", active: "◈" },
    info: { default: "?", active: "?" },
  };
  return (
    <span
      className={`transition-transform duration-200 ${active ? "scale-110" : "scale-100"}`}
    >
      {active ? icons[tab].active : icons[tab].default}
    </span>
  );
}
