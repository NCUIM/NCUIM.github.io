/**
 * Initiate NCU Portal OAuth2 login flow.
 *
 * Generates PKCE code_verifier + code_challenge, encodes the verifier
 * into the OAuth state parameter (no localStorage needed), then
 * redirects the browser to the NCU Portal authorization endpoint.
 */

import {
  NCU_OAUTH,
  encodeState,
  generateCodeVerifier,
  generateCodeChallenge,
} from "./ncu-oauth";

export async function startNcuLogin(): Promise<void> {
  const codeVerifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Pack the PKCE verifier into the state param so it survives the
  // redirect without any client-side storage.
  const state = encodeState(codeVerifier);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: "code",
    client_id: NCU_OAUTH.clientId,
    redirect_uri: NCU_OAUTH.redirectUri,
    scope: NCU_OAUTH.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${NCU_OAUTH.authorizationEndpoint}?${params.toString()}`;
}
