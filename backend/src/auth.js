import { CognitoJwtVerifier } from "aws-jwt-verify";

let verifier = null;

const getVerifier = () => {
  if (verifier) return verifier;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) throw new Error("Missing Cognito configuration");
  verifier = CognitoJwtVerifier.create({ userPoolId, clientId, tokenUse: "id" });
  return verifier;
};

export const verifyAuth = async (authorization) => {
  if (!authorization) throw new Error("Missing Authorization header");
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Missing Bearer token");

  try {
    const payload = await getVerifier().verify(token);
    return {
      sub: payload.sub,
      email: payload.email,
      groups: payload["cognito:groups"] || [],
    };
  } catch {
    throw new Error("Invalid token");
  }
};
