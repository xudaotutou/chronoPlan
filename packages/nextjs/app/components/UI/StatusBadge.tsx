export function StatusBadge({
  icon,
  color,
  label,
  pulse,
}: {
  icon: string;
  color: string;
  label: string;
  pulse?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    success: "text-success",
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };
  return (
    <div className="flex items-center gap-2.5">
      <div className={`relative ${pulse ? "animate-pulse-glow" : ""}`}>
        <span className={`text-[6px] ${colorClasses[color]}`}>{icon}</span>
        {pulse && (
          <span
            className={`absolute inset-0 ${colorClasses[color]} opacity-50 blur-sm`}
          >
            {icon}
          </span>
        )}
      </div>
      <span className="text-xs font-mono text-base-content/40">{label}</span>
    </div>
  );
}
