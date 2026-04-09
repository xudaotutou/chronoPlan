import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useTheme } from "next-themes";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
// Local chain definition (replacing @starknet-start/chains)
export const devnet = {
  id: BigInt("0x534e5f6465766e6574"),
  network: "devnet" as const,
};
import { SwitchTheme } from "./SwitchTheme";
// Use starknet.js RpcProvider directly instead of @starknet-start/react
import { RpcProvider } from "starknet";
// Import wallet store hook
import { useStarkZap } from "~~/hooks/useStarkZap";

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.network === devnet.network;

  // Use RpcProvider directly
  const rpcUrl = targetNetwork.rpcUrls.public.http[0];
  const provider = useMemo(() => {
    return new RpcProvider({
      nodeUrl: rpcUrl,
    });
  }, [rpcUrl]);
  // Get wallet state from useStarkZap
  const { address, isConnected, chainId, networkName } = useStarkZap();
  const status = isConnected ? "connected" : "disconnected";

  const [isDeployed, setIsDeployed] = useState(true);

  useEffect(() => {
    if (
      status === "connected" &&
      address &&
      chainId === targetNetwork.id &&
      networkName === targetNetwork.network
    ) {
      provider
        .getClassHashAt(address)
        .then((classHash) => {
          if (classHash) setIsDeployed(true);
          else setIsDeployed(false);
        })
        .catch((e) => {
          console.error("contract check", e);
          if (e.toString().includes("Contract not found")) {
            setIsDeployed(false);
          }
        });
    }
  }, [
    status,
    address,
    provider,
    chainId,
    targetNetwork.id,
    targetNetwork.network,
    networkName,
  ]);

  return (
    <div className=" lg:static top-0 navbar min-h-0 shrink-0 justify-end z-20 px-0 sm:px-2">
      <div className="navbar-end grow mr-2 gap-4">
        {status === "connected" && !isDeployed ? (
          <span className="bg-[#8a45fc] text-[9px] p-1 text-white">
            Wallet Not Deployed
          </span>
        ) : null}
        <CustomConnectButton />
        <SwitchTheme
          className={`pointer-events-auto ${
            isLocalNetwork ? "mb-1 lg:mb-0" : ""
          }`}
        />
      </div>
    </div>
  );
};
