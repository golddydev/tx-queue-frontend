export const checkCanConnect: (walletKey: string) => boolean = (
  walletKey = "",
) => {
  if (
    walletKey?.length > 0 &&
    window?.cardano &&
    window?.cardano[walletKey] &&
    typeof window.cardano[walletKey].enable == "function"
  ) {
    return true;
  }
  return false;
};
