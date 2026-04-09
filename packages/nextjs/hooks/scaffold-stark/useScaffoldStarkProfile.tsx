import scaffoldConfig from "~~/scaffold.config";
import { useEffect, useState } from "react";
import { StarkProfile } from "starknet";
import { supportedChains } from "~~/supportedChains";

type network = "mainnet" | "sepolia" | "devnet";

const shouldUseProfile = () => {
  const set = new Set(["mainnet", "sepolia"]);
  return (
    set.has(scaffoldConfig.targetNetworks[0].network) &&
    (scaffoldConfig.targetNetworks[0].network as network) !==
      supportedChains.devnet.network
  );
};

const starknetIdApiBaseUrl =
  (scaffoldConfig.targetNetworks[0].network as network) ===
  supportedChains.mainnet.network
    ? "https://api.starknet.id"
    : "https://sepolia.api.starknet.id";

// Validate address format (must be 0x + 64 hex chars)
const isValidStarknetAddress = (addr: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(addr);
};

export const fetchProfileFromApi = async (address: string) => {
  try {
    // Validate address before making API calls
    if (!isValidStarknetAddress(address)) {
      return { name: "", profilePicture: "" };
    }

    const addrToDomainRes = await fetch(
      `${starknetIdApiBaseUrl}/addr_to_domain?addr=${address}`,
    );

    // Don't throw on 400/404 - just return empty profile
    if (addrToDomainRes.status === 400 || addrToDomainRes.status === 404) {
      return { name: "", profilePicture: "" };
    }

    if (!addrToDomainRes.ok) {
      return { name: "", profilePicture: "" };
    }

    const addrToDomainJson = await addrToDomainRes.json();

    // Check if domain exists
    if (!addrToDomainJson.domain) {
      return { name: "", profilePicture: "" };
    }

    const domain = addrToDomainJson.domain;

    const profileRes = await fetch(
      `${starknetIdApiBaseUrl}/domain_to_data?domain=${domain}`,
    );

    // Don't throw on 404 - just return empty profile
    if (profileRes.status === 404) {
      return { name: "", profilePicture: "" };
    }

    if (!profileRes.ok) {
      return { name: "", profilePicture: "" };
    }

    const profileData = await profileRes.json();

    const id = BigInt(profileData.id).toString();

    const uriRes = await fetch(`${starknetIdApiBaseUrl}/uri?id=${id}`);

    if (!uriRes.ok) {
      return { name: "", profilePicture: "" };
    }

    const uriData = await uriRes.json();

    return {
      name: profileData.domain.domain,
      profilePicture: uriData.image,
    };
  } catch {
    // Silently ignore all profile errors - profile is optional
    return { name: "", profilePicture: "" };
  }
};

/**
 * Fetches Starknet profile information for a given address.
 * Only works on mainnet and sepolia networks (not devnet).
 * Profile fetching errors are silently ignored - profile is optional.
 *
 * @param address - The Starknet address to fetch profile for
 * @returns Profile data with name and profilePicture
 */
export const useScaffoldStarkProfile = (address: `0x${string}` | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<StarkProfile | undefined>();
  const isEnabled = shouldUseProfile();

  useEffect(() => {
    if (!isEnabled || !address) {
      setProfile({ name: "", profilePicture: "" });
      return;
    }

    setIsLoading(true);

    fetchProfileFromApi(address)
      .then((data) => {
        setProfile(data);
      })
      .catch(() => {
        // Silently ignore profile fetch errors
        setProfile({ name: "", profilePicture: "" });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [address, isEnabled]);

  return { data: profile, isLoading };
};
