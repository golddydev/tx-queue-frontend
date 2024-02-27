// import contracts
import { mintingPolicy } from "@/contracts";

// import constant
import { app as appConstant } from "@/constants/index.constant";

// import types
import { Lucid, MintingPolicy, WalletApi } from "lucid-cardano";

export const convertAddressToBech32 = async (adderss = "") => {
  try {
    const { C, fromHex } = await import("lucid-cardano");
    try {
      if (!(adderss?.length > 0)) {
        return "";
      }
      const bech32Address = C.Address.from_bytes(fromHex(adderss)).to_bech32(
        undefined,
      );
      return bech32Address;
    } catch (_) {
      try {
        const bech32Address =
          C.Address.from_bech32(adderss).to_bech32(undefined);
        return bech32Address;
      } catch (_) {
        return "";
      }
    }
  } catch (_) {
    return "";
  }
};

export const getAdaBalanceFromBalanceHexString: (
  balanceHex: string,
) => Promise<string> = async (balanceHex = "") => {
  try {
    const { C, fromHex } = await import("lucid-cardano");
    if (!(balanceHex?.length > 0)) {
      return "0";
    }
    let adaBalance: string = "0";
    const balanceBytes = fromHex(balanceHex);
    if (balanceBytes) {
      const balanceValue = C.Value.from_bytes(balanceBytes);
      if (balanceValue) {
        const balanceJson = JSON.parse(balanceValue.to_json());
        adaBalance = balanceJson?.coin || "0";
      }
    }
    return adaBalance;
  } catch (_) {
    return "0";
  }
};

export const applyParamsToMintingPolicy: (
  mintingPolicy: MintingPolicy,
  priceInAda: bigint,
  creator: string,
) => Promise<MintingPolicy> = async (mintingPolicy, priceInAda, creator) => {
  try {
    const { applyDoubleCborEncoding, applyParamsToScript } = await import(
      "lucid-cardano"
    );

    const appliedMintingPolicyScript = applyParamsToScript(
      mintingPolicy.script,
      [BigInt(priceInAda), creator],
    );
    const appliedMintingPolicy: MintingPolicy = {
      type: "PlutusV2",
      script: applyDoubleCborEncoding(appliedMintingPolicyScript),
    };

    return appliedMintingPolicy;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const buildMintTransaction: (
  wallet: WalletApi,
  assetName: string,
) => Promise<string> = async (wallet, assetName) => {
  try {
    // constant
    const ipfsURI = "ipfs://Qme4khNziAZ4YveEL9MB1rkUprNnmwwirqUrCtKcDEyg3v";
    const mediaType = "image/jpeg";
    const properties = [
      {
        key: "type",
        value: "announcement",
      },
      {
        key: "snake",
        value: "Konda",
      },
    ];
    const mintingPrice = 10000000n;

    // setup lucid
    const { Blockfrost, Lucid, fromText, Data, Constr } = await import(
      "lucid-cardano"
    );
    const blockfrostProvider = new Blockfrost(
      appConstant.blockfrostApiUrl,
      appConstant.blockfrostApiKey,
    );
    const lucid = await Lucid.new(blockfrostProvider, "Preprod");
    lucid.selectWallet(wallet);

    // make applied minting policy
    const appliedMintingPolicy = await applyParamsToMintingPolicy(
      mintingPolicy,
      mintingPrice,
      appConstant.creatorPaymentKeyHash,
    );
    const policyId = lucid.utils.validatorToScriptHash(appliedMintingPolicy);
    const contractWithStakeKeyAddress = lucid.utils.validatorToAddress(
      appliedMintingPolicy,
      { type: "Key", hash: appConstant.creatorStakeKeyHash },
    );

    // build metadata datum
    // build files_detail
    const filesDetail = new Map();
    filesDetail.set(fromText("name"), fromText(assetName));
    filesDetail.set(fromText("src"), fromText(ipfsURI));
    filesDetail.set(fromText("mediaType"), fromText(mediaType));

    const metadata = new Map();
    metadata.set(fromText("name"), fromText(assetName));
    metadata.set(fromText("image"), fromText(ipfsURI));
    filesDetail.set(fromText("mediaType"), fromText(mediaType));
    metadata.set(fromText("files"), [filesDetail]);
    // set properties
    properties.forEach((property) =>
      metadata.set(fromText(property.key), fromText(property.value)),
    );

    const datum = Data.to(
      new Constr(0, [
        metadata,
        1n,
        new Constr(0, [fromText(policyId), fromText(assetName)]),
      ]),
    );
    const mintRedeemer = Data.to(new Constr(0, []));
    const utxos = await lucid?.wallet.getUtxos()!;
    const utxo = utxos[0];

    // build mint tx
    const tx = await lucid
      .newTx()
      .collectFrom([utxo])
      .attachMintingPolicy(appliedMintingPolicy)
      .mintAssets(
        {
          [`${policyId}000643b0${fromText(assetName)}`]: 1n, // reference
          [`${policyId}000de140${fromText(assetName)}`]: 1n, // user
        },
        mintRedeemer,
      )
      .payToAddress(appConstant.creatorAddress, {
        lovelace: mintingPrice,
      })
      .payToAddressWithData(contractWithStakeKeyAddress, datum, {
        [`${policyId}000643b0${fromText(assetName)}`]: 1n, // reference
      })
      .validTo(Date.now() + appConstant.transactionValidTime)
      .attachMetadata(674, {
        msg: [`Mint ${assetName}`],
      })
      .complete();

    const txSigned = await tx.sign().complete();
    const txHash = await txSigned.submit();
    return txHash;
  } catch (err) {
    throw err;
  }
};
