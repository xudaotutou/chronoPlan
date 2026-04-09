import { type Call } from "starkzap";
import { useContractWrite } from "~~/hooks/useStarkZap";

/**
 * Provides a function to execute multiple contract write transactions in a single batch.
 *
 * @returns {Object} An object containing:
 *   - sendAsync: (calls) => Promise<string | undefined> - Function to execute the batch
 *   - isPending: boolean - Whether a transaction is pending
 *   - error: string | undefined - Error message if any
 */
export const useScaffoldMultiWriteContract = () => {
  const contractWrite = useContractWrite();

  const sendAsync = async (calls: Call[]): Promise<string | undefined> => {
    const result = await contractWrite.write(calls);
    return result.txHash;
  };

  return {
    ...contractWrite,
    sendAsync,
  };
};
