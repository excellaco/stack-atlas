import { CognitoUserPool, CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";
import type { CognitoUserSession } from "amazon-cognito-identity-js";
import { config } from "./config";
import type { User } from "./types";

const getUserPool = (): CognitoUserPool => {
  if (!config.cognitoUserPoolId || !config.cognitoClientId) {
    throw new Error("Missing Cognito configuration");
  }
  return new CognitoUserPool({
    UserPoolId: config.cognitoUserPoolId,
    ClientId: config.cognitoClientId,
  });
};

const getCurrentUser = (): CognitoUser | null => {
  try {
    return getUserPool().getCurrentUser();
  } catch {
    return null;
  }
};

export const signIn = (username: string, password: string): Promise<CognitoUserSession> => {
  const authenticationDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  });

  const user = new CognitoUser({
    Username: username,
    Pool: getUserPool(),
  });

  return new Promise<CognitoUserSession>((resolve, reject) => {
    user.authenticateUser(authenticationDetails, {
      onSuccess: (session: CognitoUserSession) => resolve(session),
      onFailure: (error: Error) => reject(error),
      newPasswordRequired: (_userAttributes: Record<string, string>) => {
        reject(new Error("Password change required. Please contact an administrator."));
      },
    });
  });
};

export const signOut = (): void => {
  const user = getCurrentUser();
  user?.signOut();
};

export const getSession = (): Promise<CognitoUserSession | null> => {
  const user = getCurrentUser();
  if (!user) return Promise.resolve(null);
  return new Promise<CognitoUserSession | null>((resolve) => {
    user.getSession((error: Error | null, session: CognitoUserSession | null) => {
      if (error || !session) {
        resolve(null);
        return;
      }
      resolve(session);
    });
  });
};

export const parseIdToken = (session: CognitoUserSession): User => {
  const token = session.getIdToken();
  const payload = token.decodePayload();
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    groups: (payload["cognito:groups"] as string[] | undefined) || [],
  };
};

/** Call getSession() which auto-refreshes via the stored refresh token.
 *  Returns the fresh JWT string, or null if the session is gone. */
export const getFreshToken = async (): Promise<string | null> => {
  const session = await getSession();
  if (!session) return null;
  return session.getIdToken().getJwtToken();
};
