import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ordermint.pos',
  appName: 'OrderMint PMS',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allows testing on local network HTTP
    url: "https://ordermintpms.tech",
    allowNavigation: ["ordermintpms.tech", "*.ordermintpms.tech"]
  }
};

export default config;