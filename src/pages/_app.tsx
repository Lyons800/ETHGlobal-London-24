"use client";

import Providers from "@/providers/Providers";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Providers>
    <Component {...pageProps} />
    </Providers>
  );
}
