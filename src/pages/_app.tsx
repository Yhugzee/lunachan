import "@/styles/globals.scss";
import type { AppProps } from "next/app";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="02496bd2-ed98-4dd4-b8a0-6cc28240bd38"
        strategy="lazyOnload"
      />
      <Component {...pageProps} />
      <SpeedInsights />
    </>
  );
}
