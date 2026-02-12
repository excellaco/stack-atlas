const runtimeConfig = typeof window !== "undefined" ? window.__APP_CONFIG__ : undefined;

const read = (v: string | undefined): string | undefined =>
  v && v.trim().length > 0 ? v : undefined;

export interface Config {
  apiBaseUrl: string;
  cognitoUserPoolId: string;
  cognitoClientId: string;
}

export const config: Config = {
  apiBaseUrl:
    read(runtimeConfig?.apiBaseUrl) ??
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    "",
  cognitoUserPoolId:
    read(runtimeConfig?.cognitoUserPoolId) ??
    (import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined) ??
    "",
  cognitoClientId:
    read(runtimeConfig?.cognitoClientId) ??
    (import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined) ??
    "",
};
