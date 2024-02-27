import { MintingPolicy } from "lucid-cardano";

import blueprint from "./plutus.json" assert { type: "json" };

const mintingPolicyCompiledCode = blueprint.validators[0].compiledCode;

export const mintingPolicy: MintingPolicy = {
  type: "PlutusV2",
  script: mintingPolicyCompiledCode,
};
