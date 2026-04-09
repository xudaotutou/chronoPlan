"use client";

import { useState } from "react";
import { useNativeCurrencyPriceDirect } from "~~/hooks/scaffold-stark/useNativeCurrencyPrice";
import { useStrkBalance } from "~~/hooks/useTokenBalance";

type Address = `0x${string}`;

type BalanceProps = {
  address?: Address;
  className?: string;
  usdMode?: boolean;
};

/**
 * Display (STRK & USD) balance of an address.
 * Uses starkzap for token balance and TanStack Query for caching.
 */
export const Balance = ({ address, className = "", usdMode }: BalanceProps) => {
  const { data: strkPrice } = useNativeCurrencyPriceDirect();
  const {
    formatted,
    isLoading: strkIsLoading,
    isError: strkError,
    symbol: strkSymbol,
  } = useStrkBalance(address);

  const [displayUsdMode, setDisplayUsdMode] = useState(
    (strkPrice ?? 0) > 0 ? Boolean(usdMode) : false,
  );

  const toggleBalanceMode = () => {
    if ((strkPrice ?? 0) > 0) {
      setDisplayUsdMode((prevMode) => !prevMode);
    }
  };

  // Show skeleton only when loading and no data yet
  if (!address || (strkIsLoading && formatted === undefined)) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded-sm"></div>
        </div>
      </div>
    );
  }

  if (strkError) {
    return (
      <div className="border-2 border-gray-400 rounded-md px-2 flex flex-col items-center max-w-fit cursor-pointer">
        <div className="text-warning">Error</div>
      </div>
    );
  }

  // Calculate the balance in USD
  const strkBalanceInUsd = parseFloat(formatted ?? "0") * (strkPrice ?? 0);

  return (
    <button
      className={`btn btn-sm btn-ghost flex flex-col font-normal items-center hover:bg-transparent ${className}`}
      onClick={toggleBalanceMode}
    >
      <div className="w-full flex items-center justify-center">
        {displayUsdMode ? (
          <div className="flex">
            <span className="text-[0.8em] font-bold mr-1">$</span>
            <span>
              {strkBalanceInUsd.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ) : (
          <div className="flex">
            <span>{parseFloat(formatted ?? "0").toFixed(4)}</span>
            <span className="text-[0.8em] font-bold ml-1">{strkSymbol}</span>
          </div>
        )}
      </div>
    </button>
  );
};
