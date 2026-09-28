import Script from "next/script";
import WalletClient from "./wallet-client";

export default function JoyWalletPage() {
  const sdkSrc = process.env.NEXT_PUBLIC_MONETAG_SDK_SRC;

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js?63"
        strategy="beforeInteractive"
      />
      {sdkSrc ? (
        <Script src={sdkSrc} strategy="afterInteractive" />
      ) : null}
      <WalletClient
        monetagFunction={process.env.NEXT_PUBLIC_MONETAG_SDK_FUNCTION ?? ""}
        monetagConfigured={Boolean(sdkSrc && process.env.NEXT_PUBLIC_MONETAG_SDK_FUNCTION)}
      />
    </>
  );
}
