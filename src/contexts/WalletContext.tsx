"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

// import utils
import { lucid as lucidUtil, wallet as walletUtil } from "@/utils/index.util";

// import constant
import { app as appConstant } from "@/constants/index.constant";

// import types
import { WalletApi } from "lucid-cardano";

export interface WalletContext {
  isConnected: boolean;
  wallet: WalletApi | undefined;
  networkId: number;
  address: string;
  stakeAddress: string;
  bech32Address: string;
  bech32StakeAddress: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  adaBalance: string;
}

const initialState: WalletContext = {
  isConnected: false,
  wallet: undefined,
  networkId: -1,
  address: "",
  stakeAddress: "",
  bech32Address: "",
  bech32StakeAddress: "",
  connect: async () => {
    throw new Error("Init function");
  },
  disconnect: () => {},
  adaBalance: "0",
};

const walletContext = createContext<WalletContext>(initialState);

const WalletContextProvider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [wallet, setWallet] = useState<WalletApi | undefined>(
    initialState.wallet,
  );
  const [networkId, setNetworkId] = useState<number>(initialState.networkId);
  const [address, setAddress] = useState<string>(initialState.address);
  const [stakeAddress, setStakeAddress] = useState<string>(
    initialState.stakeAddress,
  );
  const [bech32Address, setBech32Address] = useState<string>(
    initialState.bech32Address,
  );
  const [bech32StakeAddress, setBech32StakeAddress] = useState<string>(
    initialState.bech32StakeAddress,
  );
  const [adaBalance, setAdaBalance] = useState<string>(initialState.adaBalance);

  // update network id, and address when wallet is changed
  useEffect(() => {
    if (wallet) {
      if (
        !(
          typeof wallet.getNetworkId == "function" &&
          typeof wallet.getRewardAddresses == "function" &&
          typeof wallet.getChangeAddress == "function"
        )
      ) {
        toast.error("This wallet has an issue.");
        disconnect();
        return;
      }
      wallet
        .getNetworkId()
        .then((nId) => {
          setNetworkId(nId);
        })
        .catch((err) => {
          console.error(err);
          toast.error(err?.message || "Couldn't get network Id.");
        });
      wallet
        .getRewardAddresses()
        .then((addresses) => {
          if (addresses && addresses?.length > 0) {
            setStakeAddress(addresses[0]);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error(err?.message || "Couldn't get stake address.");
        });
      wallet
        .getChangeAddress()
        .then((changeAddress) => {
          setAddress(changeAddress);
        })
        .catch((err) => {
          console.error(err);
          toast.error(err?.message || "Couldn't get change address.");
        });

      calculateBalances();
    }
  }, [wallet]);

  useEffect(() => {
    lucidUtil.convertAddressToBech32(address).then((res) => {
      setBech32Address(res);
    });
  }, [address]);

  useEffect(() => {
    lucidUtil.convertAddressToBech32(stakeAddress).then((res) => {
      setBech32StakeAddress(res);
    });
  }, [stakeAddress]);

  // methods
  const connect = async () => {
    const walletKey = "eternl";
    try {
      // check installed
      if (walletUtil.checkCanConnect(walletKey)) {
        const connectedWallet = await window.cardano[walletKey].enable();
        if (connectedWallet) {
          setWallet(connectedWallet);
        } else {
          throw new Error("Couldn't Connect Eternl Wallet.");
        }
      } else {
        throw new Error("We only support Eternl wallet now.");
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const disconnect = () => {
    setWallet(undefined);
    setNetworkId(initialState.networkId);
    setAddress(initialState.address);
    setStakeAddress(initialState.stakeAddress);
    setAdaBalance(initialState.adaBalance);
  };

  const calculateBalances = async () => {
    try {
      if (!wallet) {
        return;
      }
      const balanceHex = await wallet.getBalance();
      const newAdaBalance = await lucidUtil.getAdaBalanceFromBalanceHexString(
        balanceHex,
      );
      setAdaBalance(newAdaBalance);
    } catch (err) {
      console.error(err);
      disconnect();
      toast.error("This wallet has an issue.");
    }
  };

  useEffect(() => {
    return () => {};
  }, []);

  const value: WalletContext = {
    isConnected: wallet ? true : false,
    wallet,
    networkId,
    address,
    stakeAddress,
    bech32Address,
    bech32StakeAddress,
    connect,
    disconnect,
    adaBalance,
  };

  return (
    <walletContext.Provider value={value}>{children}</walletContext.Provider>
  );
};

const useWallet = () => {
  return useContext(walletContext);
};

export { WalletContextProvider, useWallet };
