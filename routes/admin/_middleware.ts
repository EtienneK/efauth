import { FreshContext } from "$fresh/server.ts";
import * as oauth from "oauth4webapi";
import { oidc } from "../../oidc/oidc.ts";
import { NodeRequest } from "../../oidc/oidc.ts";
import { NodeResponse } from "../../oidc/oidc.ts";
import { ClientSession } from "../../db/models/models.ts";
import db from "../../db/db.ts";
import { WithId } from "../../db/adapters/adapters.ts";

interface State {
  session: ClientSession & WithId;
}

export const handler = [
  async function sessionMiddleware(
    req: Request,
    ctx: FreshContext<State>,
  ) {
    const nodeRequest = new NodeRequest(req, await req.bytes());
    const nodeResponse = new NodeResponse();

    const koaCtx = oidc(ctx as any).provider.app.createContext(
      nodeRequest as any,
      nodeResponse as any,
    );
    const oidcSession = await oidc(ctx as any).provider.Session.get(koaCtx);

    if (!ctx.state.session) {
      const id = oidcSession.uid + "|admin";
      ctx.state.session = (await db.clientSessions.find(id)) ?? { id };
    }
    console.log("----------------------------------------------------");
    console.log("BEFORE:");
    console.log(ctx.state.session);

    const response = await ctx.next();

    await db.clientSessions.upsert(
      ctx.state.session.id,
      ctx.state.session,
    );

    console.log("----------------------------------------------------");
    console.log("AFTER:");
    console.log(ctx.state.session);

    return response;
  },

  async function oidcAuthnMiddleware(
    _req: Request,
    ctx: FreshContext<State>,
  ) {
    let { session } = ctx.state;

    if (session.accountId) {
      if (!session.isAdmin) {
        return new Response("FORBIDDEN", { status: 403 }); // TODO
      }
      return ctx.next();
    }

    const oidcBundle = oidc(ctx as any);
    const issuer = new URL(oidcBundle.provider.issuer);

    const as = await oauth
      .discoveryRequest(issuer, { algorithm: "oidc" })
      .then((response) => oauth.processDiscoveryResponse(issuer, response));

    const serverAdminClient =
      oidcBundle.configuration.clients!.filter((c) =>
        c.client_id === "admin"
      )[0];
    const redirectUri = new URL(serverAdminClient.redirect_uris![0]);
    const client: oauth.Client = {
      client_id: serverAdminClient.client_id,
      client_secret: serverAdminClient.client_secret,
      token_endpoint_auth_method: serverAdminClient
        .token_endpoint_auth_method as oauth.ClientAuthenticationMethod,
    };

    if (redirectUri.pathname === ctx.url.pathname) {
      const currentUrl: URL = ctx.url;
      const params = oauth.validateAuthResponse(as, client, currentUrl);
      if (oauth.isOAuth2Error(params)) {
        console.error("Error Response", params);
        throw new Error(); // Handle OAuth 2.0 redirect error
      }

      const response = await oauth.authorizationCodeGrantRequest(
        as,
        client,
        params,
        redirectUri.href,
        session.code_verifier!,
      );

      let challenges: oauth.WWWAuthenticateChallenge[] | undefined;
      if ((challenges = oauth.parseWwwAuthenticateChallenges(response))) {
        for (const challenge of challenges) {
          console.error("WWW-Authenticate Challenge", challenge);
        }
        throw new Error(); // TODO: Handle WWW-Authenticate Challenges as needed
      }

      const result = await oauth.processAuthorizationCodeOpenIDResponse(
        as,
        client,
        response,
      );
      if (oauth.isOAuth2Error(result)) {
        console.error("Error Response", result);
        throw new Error(); // TODO: Handle OAuth 2.0 response body error
      }
      const claims = oauth.getValidatedIdTokenClaims(result);

      const redirectTo = session.redirectTo!;
      session = {
        ...session,
        accountId: claims.sub,
        isAdmin: true, // TODO
      };

      return Response.redirect(redirectTo);
    }

    const code_challenge_method = "S256";
    session.code_verifier = oauth.generateRandomCodeVerifier();
    const code_challenge = await oauth.calculatePKCECodeChallenge(
      session.code_verifier,
    );

    const authorizationUrl = new URL(as.authorization_endpoint!);
    authorizationUrl.searchParams.set("client_id", client.client_id);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri.href);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "openid email");
    authorizationUrl.searchParams.set("code_challenge", code_challenge);
    authorizationUrl.searchParams.set(
      "code_challenge_method",
      code_challenge_method,
    );

    session.redirectTo = ctx.url.href;
    return Response.redirect(authorizationUrl);
  },
];
