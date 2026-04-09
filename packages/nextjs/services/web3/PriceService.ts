import scaffoldConfig from "~~/scaffold.config";
import { mainnetTokens } from "starkzap";

// Avnu Price API endpoint (direct browser call)
const AVNU_PRICE_API = "https://starknet.impulse.avnu.fi/v3/tokens/prices";

export const fetchPrice = async (retries = 3): Promise<number> => {
  const strkAddress = mainnetTokens.STRK?.address?.toString();
  if (!strkAddress) return 0;

  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await fetch(AVNU_PRICE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokens: [strkAddress] }),
      });

      if (!response.ok) {
        throw new Error(`Avnu API error: ${response.status}`);
      }

      const prices = await response.json();

      // Find STRK price
      const strkPrice = prices.find(
        (p: any) => p.address.toLowerCase() === strkAddress.toLowerCase(),
      );

      // Prefer starknetMarket price, fallback to globalMarket
      return (
        strkPrice?.starknetMarket?.usd ?? strkPrice?.globalMarket?.usd ?? 0
      );
    } catch (error) {
      console.error(
        `Attempt ${attempt + 1} - Error fetching STRK price from Avnu: `,
        error,
      );
      attempt++;
      if (attempt === retries) {
        console.error(`Failed to fetch price after ${retries} attempts.`);
        return 0;
      }
    }
  }
  return 0;
};

class PriceService {
  private static instance: PriceService;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Map<
    any,
    {
      setNativeCurrencyPrice: (price: number) => void;
    }
  > = new Map();
  private currentNativeCurrencyPrice: number = 0;
  private idCounter: number = 0;

  private constructor() {}

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  public getNextId(): number {
    return ++this.idCounter;
  }

  public startPolling(
    ref: any,
    setNativeCurrencyPrice: (price: number) => void,
  ) {
    if (this.listeners.has(ref)) return;
    this.listeners.set(ref, { setNativeCurrencyPrice });

    if (this.intervalId) {
      setNativeCurrencyPrice(this.currentNativeCurrencyPrice);
      return;
    }

    this.fetchPrices();
    this.intervalId = setInterval(() => {
      this.fetchPrices();
    }, scaffoldConfig.pollingInterval);
  }

  public stopPolling(ref: any) {
    if (!this.intervalId) return;
    if (!this.listeners.has(ref)) return;

    this.listeners.delete(ref);
    if (this.listeners.size === 0) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getCurrentNativeCurrencyPrice() {
    return this.currentNativeCurrencyPrice;
  }

  private async fetchPrices() {
    try {
      const strkPrice = await fetchPrice();
      if (strkPrice) {
        this.currentNativeCurrencyPrice = strkPrice;
      }
      this.listeners.forEach((listener) => {
        listener.setNativeCurrencyPrice(
          strkPrice || this.currentNativeCurrencyPrice,
        );
      });
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }
}

export const priceService = PriceService.getInstance();
