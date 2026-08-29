import { useEffect, useRef, useState } from "react";
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

/**
 * Handles the OAuth2 callback from NCU Portal.
 * The PKCE code_verifier is decoded from the state parameter —
 * no client-side storage (localStorage / sessionStorage) is needed.
 */
const NcuAuthCallback = () => {
  const history = useHistory();
  const [error, setError] = useState<string | null>(null);
  // Guard against React 18 strict-mode double-mount
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    // Parse directly from the real browser URL
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      setError(`Missing authorization code. URL: ${window.location.href}`);
      return;
    }

    // Decode the PKCE code_verifier from the state parameter
    const codeVerifier = state ? decodeState(state) : null;
    if (!codeVerifier) {
      setError(
        state
          ? "Could not decode PKCE verifier from state parameter. State may have been modified by the authorization server."
          : "Missing state parameter — cannot verify PKCE.",
      );
      return;
    }

    // Exchange code for token
    (async () => {
      let lastError: unknown = null;
      for (const usePKCE of [true, false]) {
        try {
          const result = await requestTokenExchange(
            NCU_OAUTH.tokenEndpoint,
            code,
            codeVerifier,
            usePKCE,
          );
          saveToken(result.accessToken, result.expiresIn);
          history.replace("/timetable");
          return;
        } catch (err) {
          lastError = err;
        }
      }

      const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
      setError(`Token exchange failed\n${errMsg}`);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
