import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.igafund.app",
  appName: "igaFund",
  webDir: "dist",
  server: {
    // Required so crypto.subtle (used by offline.ts AES-GCM encryption) works
    // inside the Android WebView — it needs a secure context (https).
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: "#EDF6F1",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      backgroundColor: "#12312A",
      style: "LIGHT",
    },
  },
};

export default config;
