/// <reference types="vite/client" />

interface AppConfig {
  apiBaseUrl?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;
  }
}

export {};
