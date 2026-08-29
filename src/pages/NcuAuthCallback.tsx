import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonSpinner, IonText } from "@ionic/react";
import { NCU_OAUTH, saveToken, decodeState } from "../services/ncu-oauth";

/**
 * Exchange authorization code for access token.
 */
const requestTokenExchange = async (
  endpoint: string,
  code: string,
  codeVerifier: string,
  usePKCE: boolean,
): Promise<{ accessToken: string; expiresIn: number }> => {
  const body: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: NCU_OAUTH.redirectUri,
    client_id: NCU_OAUTH.clientId,
    client_secret: NCU_OAUTH.clientSecret,
  };
  if (usePKCE) {
    body.code_verifier = codeVerifier;
  }

  const params = new URLSearchParams(body);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`(${res.status}): ${errBody}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`No access_token in response: ${JSON.stringify(data)}`);
  }

  return { accessToken: data.access_token, expiresIn: data.expires_in ?? 3600 };
};

const parseCallbackCredentials = (): {
  code?: string;
  codeVerifier?: string;
  error?: string;
} => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return { error: `Missing authorization code. URL: ${window.location.href}` };
  }

  const codeVerifier = state ? decodeState(state) : null;
  if (!codeVerifier) {
    return {
      error: state
        ? "Could not decode PKCE verifier from state parameter. State may have been modified by the authorization server."
        : "Missing state parameter — cannot verify PKCE.",
    };
  }

  return { code, codeVerifier };
};

const exchangeAuthCode = async (
  code: string,
  codeVerifier: string,
): Promise<{ accessToken: string; expiresIn: number }> => {
  let lastError: unknown = null;
  for (const usePKCE of [true, false]) {
    try {
      return await requestTokenExchange(
        NCU_OAUTH.tokenEndpoint,
        code,
        codeVerifier,
        usePKCE,
      );
    } catch (err) {
      lastError = err;
    }
  }
  const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Token exchange failed\n${errMsg}`);
};

/**
 * Handles the OAuth2 callback from NCU Portal.
 */
const NcuAuthCallback = () => {
  const history = useHistory();
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  const runAuthExchange = useCallback(
    async (code: string, codeVerifier: string) => {
      try {
        const result = await exchangeAuthCode(code, codeVerifier);
        saveToken(result.accessToken, result.expiresIn);
        history.replace("/timetable");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [history],
  );

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const creds = parseCallbackCredentials();
    if (creds.error) {
      setError(creds.error);
      return;
    }
    if (creds.code && creds.codeVerifier) {
      runAuthExchange(creds.code, creds.codeVerifier).catch(() => {});
    }
  }, [runAuthExchange]);

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ textAlign: "center", paddingTop: "40vh" }}>
        {error ? (
          <IonText color="danger">
            <h2>登入失敗</h2>
            <p>{error}</p>
          </IonText>
        ) : (
          <>
            <IonSpinner name="crescent" />
            <p style={{ marginTop: 16, color: "var(--ncu-muted)" }}>
              正在完成 NCU Portal 驗證，請稍候…
            </p>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default NcuAuthCallback;
