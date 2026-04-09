"use client";

import {
  TokenSelector,
  DEFAULT_TOKEN,
  type Token,
} from "../TokenSelector/index";

function tokenToWei(value: string, decimals: number): string {
  if (!value || value === "") return "";
  try {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    const factor = BigInt(10) ** BigInt(decimals);
    const result = BigInt(Math.floor(num * Number(factor)));
    return result.toString();
  } catch {
    return "";
  }
}

export type AmountInputProps = {
  value: string;
  displayValue: string;
  token: Token;
  onChange: (weiValue: string, displayValue: string) => void;
  onTokenChange: (token: Token) => void;
  /** Step number for card header (e.g., "01", "02") */
  step?: string;
  /** Label text */
  label?: string;
  /** Card styling class */
  cardClass?: string;
};

export function AmountInput({
  value,
  displayValue,
  token,
  onChange,
  onTokenChange,
  step,
  label = "Amount",
  cardClass = "",
}: AmountInputProps) {
  return (
    <div
      className={`card-instrument p-5 card-hover animate-fade-up ${cardClass}`}
    >
      {(step || label) && (
        <div className="flex items-center gap-3 mb-4">
          {step && (
            <span className="text-xs font-mono text-secondary tracking-widest uppercase">
              {step}
            </span>
          )}
          <span className="font-display font-semibold">{label}</span>
          {displayValue && (
            <span className="badge badge-outline border-secondary/40 text-secondary font-mono text-xs ml-auto">
              {displayValue} {token.symbol}
            </span>
          )}
        </div>
      )}
      <div className="flex gap-3">
        <input
          type="number"
          placeholder="100"
          value={displayValue}
          onChange={(e) => {
            const rawValue = e.target.value;
            onChange(tokenToWei(rawValue, token.decimals), rawValue);
          }}
          className="input input-bordered flex-1 font-mono text-sm bg-base-300/30 border-base-300 focus:border-secondary"
          min="0"
        />
        <TokenSelector selectedToken={token} onSelect={onTokenChange} />
      </div>
    </div>
  );
}

// Simple amount input without token selector
export type SimpleAmountInputProps = {
  value: string;
  displayValue: string;
  decimals?: number;
  onChange: (weiValue: string, displayValue: string) => void;
  label?: string;
  step?: string;
  placeholder?: string;
  symbol?: string;
};

export function SimpleAmountInput({
  value,
  displayValue,
  decimals = 18,
  onChange,
  label = "Amount",
  step,
  placeholder = "100",
  symbol = "STRK",
}: SimpleAmountInputProps) {
  return (
    <div className="card-instrument p-5 card-hover animate-fade-up">
      {(step || label) && (
        <div className="flex items-center gap-3 mb-4">
          {step && (
            <span className="text-xs font-mono text-secondary tracking-widest uppercase">
              {step}
            </span>
          )}
          <span className="font-display font-semibold">{label}</span>
          {displayValue && (
            <span className="badge badge-outline border-secondary/40 text-secondary font-mono text-xs ml-auto">
              {displayValue} {symbol}
            </span>
          )}
        </div>
      )}
      <input
        type="number"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          const rawValue = e.target.value;
          onChange(tokenToWei(rawValue, decimals), rawValue);
        }}
        className="input input-bordered w-full font-mono text-sm bg-base-300/30 border-base-300 focus:border-secondary"
        min="0"
      />
    </div>
  );
}
