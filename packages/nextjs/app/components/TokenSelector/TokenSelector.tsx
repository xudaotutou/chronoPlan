"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePopularTokenPrices } from "~~/hooks/useStrkPrice";
import { sepoliaTokens, type Token } from "starkzap";
import { TokenIcon } from "./TokenIcon";
import { TokenRow } from "./TokenRow";

// Re-export Token type from starkzap
export type { Token };

// Default token (STRK)
export const DEFAULT_TOKEN: Token = sepoliaTokens.STRK;

// Popular tokens for quick access
const POPULAR_SYMBOLS = ["STRK", "ETH", "USDC", "USDT", "WBTC", "DAI"];

type TokenSelectorProps = {
  selectedToken: Token;
  onSelect: (token: Token) => void;
  className?: string;
};

export function TokenSelector({
  selectedToken,
  onSelect,
  className = "",
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Batch fetch all popular token prices in ONE request
  const { prices, isLoading: isPricesLoading } =
    usePopularTokenPrices(POPULAR_SYMBOLS);

  // Get tokens based on current network
  const tokens = sepoliaTokens;

  // Get all tokens as array
  const allTokens = Object.values(tokens);

  // Sort: popular first, then alphabetical
  const sortedTokens = useMemo(() => {
    return [...allTokens].sort((a, b) => {
      const aPopular = POPULAR_SYMBOLS.indexOf(a.symbol);
      const bPopular = POPULAR_SYMBOLS.indexOf(b.symbol);
      if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
      if (aPopular !== -1) return -1;
      if (bPopular !== -1) return 1;
      return a.symbol.localeCompare(b.symbol);
    });
  }, [allTokens]);

  // Filter tokens by search
  const filteredPopular = useMemo(() => {
    return POPULAR_SYMBOLS.map(
      (symbol) => tokens[symbol as keyof typeof tokens],
    ).filter(
      (token) =>
        token &&
        (searchQuery === "" ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.name.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [tokens, searchQuery]);

  const filteredTokens = useMemo(() => {
    return sortedTokens.filter(
      (token) =>
        searchQuery === "" ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [sortedTokens, searchQuery]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setSearchQuery("");
    setTimeout(() => {
      dialogRef.current?.showModal();
    }, 0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
    dialogRef.current?.close();
  };

  const handleSelect = (token: Token) => {
    onSelect(token);
    handleClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (rect) {
      const isBackdropClick =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;
      if (isBackdropClick) {
        handleClose();
      }
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        className={`btn btn-bordered m-0 px-3 py-2 gap-2 bg-base-300/30 border-base-300 hover:border-secondary ${className}`}
      >
        <TokenIcon token={selectedToken} size={20} />
        <span className="font-mono text-sm font-semibold">
          {selectedToken.symbol}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Modal */}
      <dialog ref={dialogRef} className="modal" onClick={handleBackdropClick}>
        <div className="modal-box bg-base-200 rounded-lg p-0 max-w-md">
          {/* Header */}
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg m-0">Select Token</h3>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Search */}
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search token"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full bg-base-300/30 border-base-300 focus:border-secondary"
            />
          </div>

          {/* Popular tokens */}
          {!searchQuery && (
            <div className="p-4 pb-2">
              <h4 className="text-xs font-semibold text-base-content/50 uppercase mb-2">
                Popular
              </h4>
              <div className="flex flex-wrap gap-2">
                {filteredPopular.map((token) => (
                  <button
                    type="button"
                    key={token.address || token.symbol}
                    onClick={() => handleSelect(token)}
                    className={`btn btn-sm gap-2 ${
                      token.symbol === selectedToken.symbol
                        ? "btn-secondary"
                        : "btn-ghost bg-base-300/30"
                    }`}
                  >
                    <TokenIcon token={token} size={16} />
                    {token.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All tokens */}
          <div className="p-4 pt-2 max-h-80 overflow-y-auto">
            <h4 className="text-xs font-semibold text-base-content/50 uppercase mb-2">
              {searchQuery ? "Results" : "All Tokens"}
            </h4>
            <div className="flex flex-col gap-1">
              {filteredTokens.map((token) => (
                <TokenRow
                  key={token.address || token.symbol}
                  token={token}
                  isSelected={token.symbol === selectedToken.symbol}
                  onSelect={() => handleSelect(token)}
                  price={prices[token.symbol]}
                  isLoading={isPricesLoading}
                />
              ))}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
