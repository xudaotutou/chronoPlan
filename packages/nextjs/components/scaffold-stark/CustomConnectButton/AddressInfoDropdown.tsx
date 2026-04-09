import { useRef, useState } from "react";
import { NetworkOptions } from "./NetworkOptions";
import CopyToClipboard from "react-copy-to-clipboard";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CopyToClipboardAny = CopyToClipboard as any;
import {
  ArrowLeftEndOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { Avatar, isStarknetName } from "~~/components/scaffold-stark";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { notification } from "~~/utils/scaffold-stark";
import { useScaffoldStarkProfile } from "~~/hooks/scaffold-stark/useScaffoldStarkProfile";
import { useStarkZap } from "~~/hooks/useStarkZap";

type Address = `0x${string}`;

type AddressInfoDropdownProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
  displayName: string;
};

export const AddressInfoDropdown = ({
  address,
  displayName,
  blockExplorerAddressLink,
}: AddressInfoDropdownProps) => {
  const { networkName, disconnect } = useStarkZap();
  const [addressCopied, setAddressCopied] = useState(false);
  const { data: profile } = useScaffoldStarkProfile(address);
  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };

  useOutsideClick(dropdownRef, closeDropdown);

  const handleDisconnect = () => {
    try {
      disconnect();
      localStorage.removeItem("lastConnectionTime");
      notification.success("Disconnect successfully!");
    } catch (err) {
      console.log(err);
      notification.success("Disconnect failure!");
    }
  };

  return (
    <>
      <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
        <summary className="btn bg-transparent btn-sm px-2 py-[0.35rem] dropdown-toggle gap-0 !h-auto border border-[#5c4fe5] ">
          <div className="hidden [@media(min-width:412px)]:block">
            <Avatar
              address={address}
              size={30}
              profilePicture={profile?.profilePicture}
            />
          </div>
          <span className="ml-2 mr-2 text-sm">
            {isStarknetName(displayName)
              ? displayName
              : profile?.name ||
                address?.slice(0, 6) + "..." + address?.slice(-4)}
          </span>
          <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0 sm:block hidden" />
        </summary>
        <ul
          tabIndex={0}
          className={`dropdown-content menu z-[2] p-2 mt-2 rounded-[5px] gap-1 border border-[#5c4fe5] bg-base-100`}
        >
          <NetworkOptions hidden={!selectingNetwork} />
          <li className={selectingNetwork ? "hidden" : ""}>
            {addressCopied ? (
              <div className="btn-sm !rounded-xl flex gap-3">
                <CheckCircleIcon
                  className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                  aria-hidden="true"
                />
                <span className=" whitespace-nowrap">Copy address</span>
              </div>
            ) : (
              <CopyToClipboardAny
                text={address}
                onCopy={() => {
                  setAddressCopied(true);
                  setTimeout(() => {
                    setAddressCopied(false);
                  }, 800);
                }}
              >
                <div className="btn-sm !rounded-xl flex gap-3">
                  <DocumentDuplicateIcon
                    className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                    aria-hidden="true"
                  />
                  <span className=" whitespace-nowrap">Copy address</span>
                </div>
              </CopyToClipboardAny>
            )}
          </li>
          <li className={selectingNetwork ? "hidden" : ""}>
            <label
              htmlFor="qrcode-modal"
              className="btn-sm !rounded-xl flex gap-3"
            >
              <QrCodeIcon className="h-6 w-4 ml-2 sm:ml-0" />
              <span className="whitespace-nowrap">View QR Code</span>
            </label>
          </li>
          {networkName !== "devnet" ? (
            <li className={selectingNetwork ? "hidden" : ""}>
              <button
                className="menu-item btn-sm !rounded-xl flex gap-3"
                type="button"
              >
                <ArrowTopRightOnSquareIcon className="h-6 w-4 ml-2 sm:ml-0" />
                <a
                  target="_blank"
                  href={blockExplorerAddressLink}
                  rel="noopener noreferrer"
                  className="whitespace-nowrap"
                >
                  View on Block Explorer
                </a>
              </button>
            </li>
          ) : null}

          <li className={selectingNetwork ? "hidden" : "p-0"}>
            <button
              className="menu-item btn-sm !rounded-xl flex gap-3 py-3 text-base-content"
              type="button"
              onClick={handleDisconnect}
            >
              <ArrowLeftEndOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" />
              <span>Disconnect</span>
            </button>
          </li>
        </ul>
      </details>
    </>
  );
};
