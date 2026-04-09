"use client";

import { useLocalStorage } from "usehooks-ts";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useStarkZap } from "~~/hooks/useStarkZap";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";

const LAST_CONNECTED_TYPE_KEY = "starkzap_connection_type";

const ConnectModal = () => {
  const { connectWithCartridge } = useStarkZap();
  const [, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
    { id: "" },
  );
  const [, setLastConnectionTime] = useLocalStorage<number>(
    LAST_CONNECTED_TIME_LOCALSTORAGE_KEY,
    0,
  );
  const [, setWasDisconnectedManually] = useLocalStorage<boolean>(
    "wasDisconnectedManually",
    false,
  );
  const [, setConnectionType] = useLocalStorage<string>(
    LAST_CONNECTED_TYPE_KEY,
    "",
  );

  const { mutate: handleConnect, isPending } = useMutation({
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

  return (
    <button
      onClick={() => handleConnect()}
      disabled={isPending}
      className="rounded-[18px] btn-sm font-bold px-8 bg-btn-wallet py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        "Connect"
      )}
    </button>
  );
};

export default ConnectModal;
