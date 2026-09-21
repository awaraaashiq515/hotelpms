import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.guestflow.pms',
  appName: 'GuestFlow PMS',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allows testing on local network HTTP
    url: "https://ordermintpms.tech/login",
    allowNavigation: ["ordermintpms.tech", "*.ordermintpms.tech"]
  }
};

export default config;