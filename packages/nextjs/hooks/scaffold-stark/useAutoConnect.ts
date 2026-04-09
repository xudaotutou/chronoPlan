"use client";

import { useEffect, useRef } from "react";
import { useStarkZap } from "~~/hooks/useStarkZap";
import scaffoldConfig from "~~/scaffold.config";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";

const LAST_CONNECTED_TYPE_KEY = "starkzap_connection_type";
const WAS_DISCONNECTED_KEY = "was_disconnected_manually";

/**
 * Auto-connects wallet if user has connected before and meets auto-connect criteria.
 * This hook automatically reconnects the user's wallet on app initialization if:
 * - Auto-connect is enabled in scaffold config
 * - User was not manually disconnected
 * - Time since last connection hasn't exceeded TTL
 *
 * Only supports Cartridge connection.
 *
 * @returns {void} This hook doesn't return any value but performs auto-connection side effects
 */
export const useAutoConnect = (): void => {
  const { connectWithCartridge } = useStarkZap();
  const { isConnected } = useStarkZap();
  const hasAutoConnected = useRef(false);

  useEffect(() => {
    if (hasAutoConnected.current) return;
    if (!scaffoldConfig.walletAutoConnect) return;

    const wasDisconnected =
      localStorage.getItem(WAS_DISCONNECTED_KEY) === "true";
    if (wasDisconnected) return;

    const lastConnectionTime = parseInt(
      localStorage.getItem(LAST_CONNECTED_TIME_LOCALSTORAGE_KEY) || "0",
    );
    const ttlExpired =
      Date.now() - lastConnectionTime > scaffoldConfig.autoConnectTTL;
    if (ttlExpired) return;

    const connectionType = localStorage.getItem(LAST_CONNECTED_TYPE_KEY);
    if (!connectionType) return;

    hasAutoConnected.current = true;

    // Auto-connect with Cartridge
    if (connectionType === "cartridge") {
      connectWithCartridge();
    }
  }, [connectWithCartridge, isConnected]);
};
