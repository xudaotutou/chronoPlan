"use client";

import type { Token } from "starkzap";

// Token icon component using starkzap metadata
export function TokenIcon({
  token,
  size = 24,
}: {
  token: Token;
  size?: number;
}) {
  const logoUrl = token.metadata?.logoUrl?.toString();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={token.symbol}
        width={size}
        height={size}
        className="rounded-full"
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
    );
  }

  // Fallback to colored initials
  const colors: Record<string, string> = {
    STRK: "#3b82f6",
    ETH: "#627eea",
    USDC: "#2775ca",
    USDT: "#26a17b",
    WBTC: "#f7931a",
    DAI: "#f5ac37",
  };

  const color = colors[token.symbol] || "#888888";

  return (
    <div
      className="rounded-full flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        color: "white",
        fontSize: size * 0.35,
      }}
    >
      {token.symbol.slice(0, 2)}
    </div>
  );
}
