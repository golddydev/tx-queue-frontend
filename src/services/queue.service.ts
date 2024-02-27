import axios from "axios";

// import constant
import { app as appConstant } from "@/constants/index.constant";

// import types
import { JobStatus } from "@/interfaces/queue.interface";

export const addTxHashJob: (
  txHash: string,
) => Promise<{ success: boolean }> = async (txHash) => {
  try {
    const result = await axios.post<{ success: boolean }>(
      `${appConstant.backendApiURL}/mints`,
      {
        txHash,
      },
    );
    return result.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const getTxHashJobStatus: (
  txHash: string,
) => Promise<{ status: JobStatus }> = async (txHash) => {
  try {
    const result = await axios.get<{ status: JobStatus }>(
      `${appConstant.backendApiURL}/mints/${txHash}`,
    );
    return result.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
