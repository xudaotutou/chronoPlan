"use client";

export function ChronometricEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card-instrument p-8 relative overflow-hidden">
      {/* Background dial pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          <defs>
            <pattern
              id="dial-pattern"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.25"
              />
              <circle
                cx="50"
                cy="50"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.25"
              />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#dial-pattern)" />
        </svg>
      </div>

      <div className="card-body items-center text-center py-16 relative z-10">
        {/* Animated clock element */}
        <div className="relative w-32 h-32 mb-8">
          {/* Outer glow */}
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />

          {/* Main dial */}
          <svg viewBox="0 0 128 128" className="w-full h-full">
            {/* Outer rings */}
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-primary/30"
            />
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary/20"
            />
            <circle
              cx="64"
              cy="64"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary/10"
            />

            {/* Tick marks - hours */}
            {[...Array(12)].map((_, i) => (
              <line
                key={`hour-${i}`}
                x1="64"
                y1="8"
                x2="64"
                y2={i % 3 === 0 ? "16" : "12"}
                stroke="currentColor"
                strokeWidth={i % 3 === 0 ? "2" : "1"}
                className="text-primary/60"
                transform={`rotate(${i * 30} 64 64)`}
              />
            ))}

            {/* Minute marks */}
            {[...Array(60)].map(
              (_, i) =>
                i % 5 !== 0 && (
                  <circle
                    key={`min-${i}`}
                    cx={64 + 52 * Math.sin((i * 6 * Math.PI) / 180)}
                    cy={64 - 52 * Math.cos((i * 6 * Math.PI) / 180)}
                    r="1"
                    fill="currentColor"
                    className="text-primary/30"
                  />
                ),
            )}

            {/* Quarter markers */}
            {[0, 3, 6, 9].map((hour) => (
              <circle
                key={`marker-${hour}`}
                cx={64 + 44 * Math.sin((hour * 30 * Math.PI) / 180)}
                cy={64 - 44 * Math.cos((hour * 30 * Math.PI) / 180)}
                r="3"
                fill="currentColor"
                className="text-primary"
              />
            ))}

            {/* Center jewel */}
            <circle
              cx="64"
              cy="64"
              r="6"
              fill="currentColor"
              className="text-primary"
            />
            <circle
              cx="64"
              cy="64"
              r="3"
              fill="currentColor"
              className="text-base-100"
            />

            {/* Animated second hand */}
            <line
              x1="64"
              y1="64"
              x2="64"
              y2="20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-accent animate-tick"
              style={{ transformOrigin: "64px 64px" }}
            />

            {/* Hour hand (static) */}
            <line
              x1="64"
              y1="64"
              x2="80"
              y2="52"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-primary"
            />

            {/* Minute hand (static) */}
            <line
              x1="64"
              y1="64"
              x2="48"
              y2="36"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-secondary"
            />
          </svg>

          {/* Floating elements */}
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-accent/30 animate-float" />
          <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-secondary/30 animate-float-delay" />
        </div>
        {/* Typography */}
        <div className="space-y-2 mb-8">
          <h3 className="font-display font-bold text-xl text-base-content">
            No schedules configured
          </h3>
          <p className="text-sm text-base-content/50 font-mono max-w-md">
            Create your first vesting schedule with multiple plans
          </p>
        </div>

        {/* Decorative spec lines */}

        <div className="flex items-center gap-6 mb-8 opacity-50">
          <div className="flex items-center gap-2">
            <span className="w-8 h-px bg-gradient-to-r from-transparent to-primary" />
            <span className="text-[10px] font-mono text-base-content/40">
              TWAMM
            </span>
          </div>
          <div className="text-primary">◆</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-base-content/40">
              Starknet
            </span>
            <span className="w-8 h-px bg-gradient-to-l from-transparent to-primary" />
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="btn btn-primary font-mono text-sm gap-3 relative overflow-hidden group"
          onClick={onCreate}
        >
          {/* Button glow effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

          {/* Clock icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Create First Schedule</span>
        </button>
      </div>
    </div>
  );
}
