"use client";

export function WalletRequiredView() {
  return (
    <div className="card-instrument p-8 animate-fade-up">
      <div className="card-body items-center text-center py-16">
        {/* Wallet icon dial */}
        <div className="relative w-20 h-20 mb-6">
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-base-300"
            />
            <circle
              cx="40"
              cy="40"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-base-300/50"
            />
            {/* Lock icon */}
            <rect
              x="28"
              y="38"
              width="24"
              height="16"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-base-content/30"
            />
            <path
              d="M32 38 V32 a8 8 0 0 1 16 0 V38"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-base-content/30"
            />
          </svg>
        </div>

        <h3 className="font-display font-bold text-lg mb-2">Wallet Required</h3>
        <p className="text-sm text-base-content/40 font-mono">
          Connect your wallet to create vesting schedules
        </p>
      </div>
    </div>
  );
}
