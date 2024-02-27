"use client";
import { useEffect, useState } from "react";

// import context
import { useWallet } from "@/contexts/WalletContext";

// import service
import { queue as queueService } from "@/services/index.service";

// import components
import Button from "@/components/Button";
import { toast } from "react-toastify";

// import constant
import { app as appConstant } from "@/constants/index.constant";

// import utils
import { common as commonUtil, lucid as lucidUtil } from "@/utils/index.util";
import Decimal from "decimal.js";

// import types
import { JobStatus } from "@/interfaces/queue.interface";

export default function Page() {
  const numberFormat = Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const { connect, isConnected, networkId, bech32Address, adaBalance, wallet } =
    useWallet();

  const [assetName, setAssetName] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [status, setStatus] = useState<JobStatus>("unknown");

  useEffect(() => {
    if (txHash == "") {
      return;
    }
    const timerId = setInterval(async () => {
      const { status: updatedStatus } = await queueService.getTxHashJobStatus(
        txHash,
      );
      setStatus(updatedStatus);
      if (updatedStatus == "failed" || updatedStatus == "completed") {
        clearInterval(timerId);
      }
    }, 3000);
    return () => {
      clearInterval(timerId);
    };
  }, [txHash]);

  const onConnect = async () => {
    try {
      setLoading(true);
      await connect();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err?.message || "Something went wrong.");
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onMint = async () => {
    setTxHash("");
    if (assetName == "") {
      toast.error("Input Asset Name");
      return;
    }
    if (!wallet) {
      toast.error("Connect Wallet");
      return;
    }
    try {
      setLoading(true);
      const txHash = await lucidUtil.buildMintTransaction(wallet, assetName);
      setTxHash(txHash);
      toast.success("Successfully Submitted");
      const { success } = await queueService.addTxHashJob(txHash);
      if (!success) {
        toast.error("Tx is not added to the queue for checking.");
      }
    } catch (err) {
      toast.error("Minting failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen w-full p-10">
      {isConnected ? (
        <>
          <div className="text-cyan-500 text-center text-xl mb-3">
            {commonUtil.prettifyAddress(bech32Address)}
          </div>
          <div className="text-violet-500 text-center text-xl mb-6 font-bold">
            {numberFormat.format(
              new Decimal(adaBalance).dividedBy(Math.pow(10, 6)).toNumber(),
            )}{" "}
            ADA
          </div>
          {networkId == 0 ? (
            <div className="text-center">
              <div className="mt-4">
                NFT Policy Id: <b>{appConstant.nftPolicyId}</b>
              </div>
              <div className="mt-4">
                Asset Name:{" "}
                <input
                  type="text"
                  className="p-2 text-black text-xl border-[1px] border-black"
                  placeholder="Asset Name"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-center mt-4">
                <img
                  src="https://ipfs.io/ipfs/Qme4khNziAZ4YveEL9MB1rkUprNnmwwirqUrCtKcDEyg3v"
                  alt="nft"
                  width={200}
                  height={300}
                />
              </div>
              <div className="mt-8">
                <Button
                  className="w-[120px]"
                  color="secondary"
                  text="Mint"
                  onClick={onMint}
                  loading={loading}
                />
              </div>
              {txHash != "" && (
                <div className="text-center mt-8">
                  Status:{" "}
                  <b>
                    {status == "unknown"
                      ? "Loading..."
                      : status == "completed"
                      ? "On Chain"
                      : status == "failed"
                      ? "Failed"
                      : "Checking..."}
                  </b>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-3xl">
              Change to Preprod Network
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-3xl">
          <div className="mb-6">Connect Wallet</div>
          <Button
            color="primary"
            text="Connect"
            onClick={onConnect}
            loading={loading}
          />
        </div>
      )}
    </main>
  );
}
