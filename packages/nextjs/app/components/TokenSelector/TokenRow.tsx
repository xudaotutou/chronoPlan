"use client";

import type { Token } from "starkzap";
import { TokenIcon } from "./TokenIcon";

// Format price for display
function formatPrice(price: number | undefined, symbol: string): string {
  if (price === undefined) return "—";

  // Stablecoins should be ~$1
  if (symbol === "USDC" || symbol === "USDT" || symbol === "DAI") {
    return `$${price.toFixed(2)}`;
  }

  // Small prices (< $1)
  if (price < 1) {
    return `$${price.toFixed(4)}`;
  }

  // Regular prices
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `$${price.toFixed(2)}`;
}

// Popular tokens for quick access
const POPULAR_SYMBOLS = ["STRK", "ETH", "USDC", "USDT", "WBTC", "DAI"];

// Token row - receives price as prop to avoid per-row hooks
export function TokenRow({
  token,
  isSelected,
  onSelect,
  price,
  isLoading,
}: {
  token: Token;
  isSelected: boolean;
  onSelect: () => void;
  price: number | undefined;
  isLoading: boolean;
}) {
  const isPopular = POPULAR_SYMBOLS.includes(token.symbol);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-base-300/50 transition-colors ${
        isSelected ? "bg-secondary/20 border border-secondary/30" : ""
      }`}
    >
      <TokenIcon token={token} size={36} />
      <div className="flex flex-col items-start flex-1">
        <span className="font-mono text-sm font-semibold">{token.symbol}</span>
        <span className="text-xs text-base-content/50">{token.name}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-mono text-sm">
          {(isPopular || isSelected) && !isLoading ? (
            formatPrice(price, token.symbol)
          ) : isLoading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            "—"
          )}
        </span>
      </div>
    </button>
  );
}
