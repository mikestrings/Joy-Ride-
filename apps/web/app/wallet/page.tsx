"use client";

import Script from "next/script";
import { useState } from "react";
import WalletClient from "./wallet-client";

export default function JoyWalletPage() {
  const sdkSrc = process.env.NEXT_PUBLIC_MONETAG_SDK_SRC;
  const sdkFunction = process.env.NEXT_PUBLIC_MONETAG_SDK_FUNCTION;

  const [monetagReady, setMonetagReady] = useState(false);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js?63"
        strategy="beforeInteractive"
      />

      {sdkSrc && sdkFunction ? (
        <Script
          id="monetag-sdk"
          src={sdkSrc}
          data-zone="11910147"
          data-sdk={sdkFunction}
          strategy="afterInteractive"
          onLoad={() => {
            console.log("Monetag SDK loaded");
            setMonetagReady(true);
          }}
          onError={() => {
            console.error("Monetag SDK failed to load");
            setMonetagReady(false);
          }}
        />
      ) : null}

      <WalletClient
        monetagFunction={sdkFunction ?? ""}
        monetagConfigured={Boolean(sdkSrc && sdkFunction)}
        monetagReady={monetagReady}
      />
    </>
  );
}
