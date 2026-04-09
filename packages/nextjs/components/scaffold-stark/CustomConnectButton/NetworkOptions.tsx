import { useTheme } from "next-themes";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/solid";
import { getNetworkColor } from "~~/hooks/scaffold-stark";
import { getTargetNetworks } from "~~/utils/scaffold-stark";
import { useStarkZap } from "~~/hooks/useStarkZap";
import { useMemo } from "react";
import { constants } from "starknet";

type NetworkOptionsProps = {
  hidden?: boolean;
};

export const NetworkOptions = ({ hidden = false }: NetworkOptionsProps) => {
  const { chainId } = useStarkZap();
  const switchChain = (_params: { chainId: string }) => {
    throw new Error("Network switching not supported with current wallet");
  };
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const allowedNetworks = getTargetNetworks();

  // note: might need a cleaner solutiojn
  const allowedNetworksMapping = useMemo(() => {
    return Object.fromEntries(
      allowedNetworks.map((chain) => [chain.network, chain.id.toString(16)]),
    );
  }, [allowedNetworks]);

  return (
    <>
      {allowedNetworks
        .filter((allowedNetwork) => allowedNetwork.id !== chainId)
        .map((allowedNetwork) => (
          <li key={allowedNetwork.network} className={hidden ? "hidden" : ""}>
            <button
              className="menu-item btn-sm rounded-xl! flex gap-3 py-3 whitespace-nowrap"
              type="button"
              onClick={() =>
                switchChain({
                  chainId: allowedNetworksMapping[allowedNetwork.network],
                })
              }
            >
              <ArrowsRightLeftIcon className="h-6 w-4 ml-2 sm:ml-0" />
              <span>
                Switch to{" "}
                <span
                  style={{
                    color: getNetworkColor(allowedNetwork, isDarkMode),
                  }}
                >
                  {allowedNetwork.name}
                </span>
              </span>
            </button>
          </li>
        ))}
    </>
  );
};
