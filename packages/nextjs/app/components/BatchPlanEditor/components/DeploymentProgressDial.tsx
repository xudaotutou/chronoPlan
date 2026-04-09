"use client";

type DeploymentProgressDialProps = {
  status: "idle" | "deploying" | "success" | "error";
  totalRounds: number;
  completedRounds: number;
};

export function DeploymentProgressDial({
  status,
  totalRounds,
  completedRounds,
}: DeploymentProgressDialProps) {
  const progress = totalRounds > 0 ? (completedRounds / totalRounds) * 100 : 0;

  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-base-300"
        />

        {/* Progress arc */}
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke={status === "error" ? "currentColor" : "currentColor"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 28 * (progress / 100)} ${2 * Math.PI * 28}`}
          className={
            status === "error"
              ? "text-error"
              : status === "success"
                ? "text-success"
                : "text-primary"
          }
        />
      </svg>

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {status === "idle" && <span className="text-base-content/30">◇</span>}
        {status === "deploying" && (
          <div className="loading loading-spinner loading-sm" />
        )}
        {status === "success" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {status === "error" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
