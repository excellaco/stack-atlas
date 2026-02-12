import { CognitoUserPool, CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";
import { config } from "./config";

const getUserPool = () => {
  if (!config.cognitoUserPoolId || !config.cognitoClientId) {
    throw new Error("Missing Cognito configuration");
  }
  return new CognitoUserPool({
    UserPoolId: config.cognitoUserPoolId,
    ClientId: config.cognitoClientId,
  });
};

const getCurrentUser = () => {
  try {
    return getUserPool().getCurrentUser();
  } catch {
    return null;
  }
};

export const signIn = (username, password) => {
  const authenticationDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  });

  const user = new CognitoUser({
    Username: username,
    Pool: getUserPool(),
  });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authenticationDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (error) => reject(error),
      newPasswordRequired: (_userAttributes) => {
        reject(new Error("Password change required. Please contact an administrator."));
      },
    });
  });
};

export const signOut = () => {
  const user = getCurrentUser();
  user?.signOut();
};

export const getSession = () => {
  const user = getCurrentUser();
  if (!user) return Promise.resolve(null);
  return new Promise((resolve) => {
    user.getSession((error, session) => {
      if (error || !session) {
        resolve(null);
        return;
      }
      resolve(session);
    });
  });
};

export const parseIdToken = (session) => {
  const token = session.getIdToken();
  const payload = token.decodePayload();
  return {
    sub: payload.sub,
    email: payload.email,
    groups: payload["cognito:groups"] || [],
  };
};

/** Call getSession() which auto-refreshes via the stored refresh token.
 *  Returns the fresh JWT string, or null if the session is gone. */
export const getFreshToken = async () => {
  const session = await getSession();
  if (!session) return null;
  return session.getIdToken().getJwtToken();
};
