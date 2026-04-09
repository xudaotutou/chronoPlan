import { create } from "zustand";
import scaffoldConfig from "~~/scaffold.config";
import { ChainWithAttributes } from "~~/utils/scaffold-stark";

/**
 * Zustand Store
 *
 * You can add global state to the app using this useGlobalState, to get & set
 * values from anywhere in the app.
 *
 * Think about it as a global useState.
 *
 * NOTE: nativeCurrencyPrice has been moved to TanStack Query (useNativeCurrencyPriceDirect)
 * to avoid render loops caused by Zustand store subscriptions.
 */

type GlobalState = {
  targetNetwork: ChainWithAttributes;
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;
};

export const useGlobalState = create<GlobalState>((set) => ({
  targetNetwork: scaffoldConfig.targetNetworks[0],
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) =>
    set(() => ({ targetNetwork: newTargetNetwork })),
}));
