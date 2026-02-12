// JWT verification using aws-jwt-verify (Cognito's official library).
// We verify the ID token (not access token) because it contains the user's
// email and cognito:groups claims, which we need for authorization.
import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { CognitoJwtVerifierSingleUserPool } from "aws-jwt-verify/cognito-verifier";
import type { User } from "./types";

type IdTokenVerifier = CognitoJwtVerifierSingleUserPool<{
  userPoolId: string;
  tokenUse: "id";
  clientId: string;
}>;

let verifier: IdTokenVerifier | null = null;

const getVerifier = (): IdTokenVerifier => {
  if (verifier) return verifier;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) throw new Error("Missing Cognito configuration");
  verifier = CognitoJwtVerifier.create({ userPoolId, clientId, tokenUse: "id" });
  return verifier;
};

export const verifyAuth = async (authorization: string | undefined): Promise<User> => {
  if (!authorization) throw new Error("Missing Authorization header");
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Missing Bearer token");

  try {
    const payload = await getVerifier().verify(token);
    return {
      sub: payload.sub,
      email: (payload.email as string | undefined) ?? "",
      groups: payload["cognito:groups"] || [],
    };
  } catch {
    throw new Error("Invalid token");
  }
};
