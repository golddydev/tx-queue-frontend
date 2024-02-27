export const prettifyAddress: (address: string) => string = (address = "") => {
  return address.slice(0, 6) + "..." + address.slice(-6);
};
