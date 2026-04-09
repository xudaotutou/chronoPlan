"use client";
import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocalStorage } from "usehooks-ts";
import toast from "react-hot-toast";
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import ConnectModal from "./ConnectModal";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { useAutoConnect, useNetworkColor } from "~~/hooks/scaffold-stark";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useAccount } from "~~/hooks/useAccount";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-stark";
import { useStarkZap } from "~~/hooks/useStarkZap";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";

const LAST_CONNECTED_TYPE_KEY = "starkzap_connection_type";

// Check if we're in development mode
const isDevelopmentMode =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK === "dev";

export const CustomConnectButton = () => {
  useAutoConnect();
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();
  const {
    address: accountAddress,
    chainId: accountChainId,
    isConnected,
  } = useAccount();
  const [wasDisconnectedManually, setWasDisconnectedManually] =
    useLocalStorage<boolean>("wasDisconnectedManually", false);
  const [, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
    { id: "" },
  );
  const [, setLastConnectionTime] = useLocalStorage<number>(
    LAST_CONNECTED_TIME_LOCALSTORAGE_KEY,
    0,
  );
  const [, setConnectionType] = useLocalStorage<string>(
    LAST_CONNECTED_TYPE_KEY,
    "",
  );

  const { connectWithCartridge } = useStarkZap();

  const { mutate: handleConnect, isPending: isConnecting } = useMutation({
    mutationFn: async () => {
      setWasDisconnectedManually(false);
      await connectWithCartridge();
      setLastConnector({ id: "Cartridge" });
      setLastConnectionTime(Date.now());
      setConnectionType("cartridge");
    },
    onError: (err: Error) => {
      console.error("Wallet connection failed:", err);
      toast.error(err.message || "Failed to connect wallet");
    },
  });

  const blockExplorerAddressLink = useMemo(() => {
    return accountAddress
      ? getBlockExplorerAddressLink(targetNetwork, accountAddress)
      : "";
  }, [accountAddress, targetNetwork]);

  // Not connected or manually disconnected
  if (!isConnected || wasDisconnectedManually) {
    if (isDevelopmentMode) {
      return <ConnectModal />;
    }

    // Production mode: directly trigger Cartridge connection
    return (
      <button
        type="button"
        onClick={() => handleConnect()}
        disabled={isConnecting}
        className="rounded-[18px] btn-sm font-bold px-8 bg-btn-wallet py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          "Connect"
        )}
      </button>
    );
  }

  const isLoading =
    isConnected && (!accountAddress || !targetNetwork.name || !accountChainId);

  if (isLoading || isConnecting) {
    return (
      <button
        type="button"
        disabled
        className="w-36 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
      >
        &nbsp;
      </button>
    );
  }

  // Skip wrong network check for devnet-like networks
  const isDevnetLike = targetNetwork.network === "devnet";
  if (!isDevnetLike && accountChainId !== targetNetwork.id) {
    return <WrongNetworkDropdown />;
  }

  // At this point, accountAddress is guaranteed to be defined when isConnected is true
  const address = accountAddress as `0x${string}`;

  return (
    <>
      <div className="flex flex-col items-center max-sm:mt-2">
        <Balance address={address} className="min-h-0 h-auto" />
        <span className="text-xs ml-1" style={{ color: networkColor }}>
          {targetNetwork.name}
        </span>
      </div>
      <AddressInfoDropdown
        address={address}
        displayName=""
        blockExplorerAddressLink={blockExplorerAddressLink}
      />
      <AddressQRCodeModal address={address} modalId="qrcode-modal" />
    </>
  );
};
