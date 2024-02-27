import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// import context
import { WalletContextProvider } from "@/contexts/WalletContext";

// import toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>{children}</WalletContextProvider>
        <ToastContainer />
      </body>
    </html>
  );
}