const runtimeConfig = typeof window !== "undefined" ? window.__APP_CONFIG__ : undefined;
const read = (v) => (v && v.trim().length > 0 ? v : undefined);

export const config = {
  apiBaseUrl: read(runtimeConfig?.apiBaseUrl) ?? import.meta.env.VITE_API_BASE_URL ?? "",
  cognitoUserPoolId:
    read(runtimeConfig?.cognitoUserPoolId) ?? import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
  cognitoClientId:
    read(runtimeConfig?.cognitoClientId) ?? import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
};
