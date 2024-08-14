import { FreshContext } from "$fresh/server.ts";
import * as oauth from "oauth4webapi";
import { oidc } from "../../oidc/oidc.ts";
import { NodeRequest } from "../../oidc/oidc.ts";
import { NodeResponse } from "../../oidc/oidc.ts";
import { ClientSession } from "../../db/models/models.ts";
import db from "../../db/db.ts";
import { WithId } from "../../db/adapters/adapters.ts";
import { secureId } from "../../utils/crypto.ts";
import { deleteCookie, getCookies, setCookie } from "@std/http/cookie";
import { handler as oidcHandler } from "../oidc/[...oidc].ts";

let as: oauth.AuthorizationServer | undefined = undefined;

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
    const isSignedIn = !!oidcSession.accountId;

    const cookieName = "_session_admin";
    const clientSessionId: string | undefined =
      getCookies(req.headers)[cookieName];
    const oidcSessionId = isSignedIn ? oidcSession.jti + "_admin" : undefined;

    let clientSessionToDelete: string | undefined = undefined;
    let createCookie = true;
    let sessionData: ClientSession & WithId = { id: secureId() };
    if (!clientSessionId && !oidcSessionId) {
      // Defaults above
    } else if (clientSessionId && !oidcSessionId) {
      const clientSession = await db.clientSessions.find(clientSessionId);
      if (clientSession) {
        sessionData = clientSession;
        createCookie = false;
      }
    } else if (!clientSessionId && oidcSessionId) {
      const clientSession = await db.clientSessions.find(oidcSessionId);
      if (clientSession) {
        sessionData = clientSession;
        createCookie = false;
      }
    } else if (clientSessionId && oidcSessionId) {
      const clientSession = await db.clientSessions.find(clientSessionId);
      if (clientSession) {
        sessionData = clientSession;
        createCookie = false;
        sessionData.id = oidcSessionId;
        clientSessionToDelete = clientSessionId;
      }
    }

    ctx.state.session = sessionData;

    const response = await ctx.next();
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) =>
      responseHeaders.append(key, value)
    );

    const cookieOptions = {
      path: "/admin",
    };
    if (createCookie) {
      setCookie(responseHeaders, {
        name: cookieName,
        value: ctx.state.session.id,
        ...cookieOptions,
      });
    }

    if (clientSessionToDelete) {
      deleteCookie(responseHeaders, cookieName, cookieOptions);
      await db.clientSessions.destroy(clientSessionToDelete);
    }

    const expireAt = Math.floor(oidcSession.exp - (Date.now() / 1000));
    await db.clientSessions.upsert(
      ctx.state.session.id,
      ctx.state.session,
      expireAt,
    );

    return new Response(response.body, {
      headers: responseHeaders,
      status: response.status,
      statusText: response.statusText,
    });
  },

  async function oidcAuthnMiddleware(
    req: Request,
    ctx: FreshContext<State>,
  ) {
    if (ctx.state.session.accountId) {
      if (!ctx.state.session.isAdmin) {
        return new Response("FORBIDDEN", { status: 403 }); // TODO
      }
      return ctx.next();
    }

    const oidcBundle = oidc(ctx as any);
    const issuer = new URL(oidcBundle.provider.issuer);

    async function customFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const fetchReq = new Request(input, init);
      const ctxUrl = ctx.url;
      ctx.url = new URL(new URL(fetchReq.url).pathname, ctxUrl);

      const oidcReqHeaders = new Headers();
      fetchReq.headers.forEach((value, key) =>
        oidcReqHeaders.append(key, value)
      );
      ["host", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto"]
        .forEach((headerName) => {
          if (req.headers.get(headerName)) {
            oidcReqHeaders.set(headerName, req.headers.get(headerName)!);
          }
        });
      if (fetchReq.body) {
        oidcReqHeaders.set(
          "content-length",
          (await fetchReq.text()).length + "",
        );
      }

      const oidcReq = new Request(ctx.url, {
        ...init,
        headers: oidcReqHeaders,
      });

      const response = await oidcHandler(oidcReq, ctx as any);
      ctx.url = ctxUrl;
      return response;
    }

    if (!as) {
      const discoveryRequestResponse = await oauth.discoveryRequest(issuer, {
        algorithm: "oidc",
        [oauth.customFetch]: customFetch,
      });

      as = await oauth.processDiscoveryResponse(
        issuer,
        discoveryRequestResponse,
      );
    }

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
        ctx.state.session.code_verifier!,
        { [oauth.customFetch]: customFetch },
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

      const redirectTo = ctx.state.session.redirectTo!;
      ctx.state.session = {
        ...ctx.state.session,
        accountId: claims.sub,
        isAdmin: true, // TODO
      };

      return Response.redirect(redirectTo);
    }

    const code_challenge_method = "S256";
    ctx.state.session.code_verifier = oauth.generateRandomCodeVerifier();
    const code_challenge = await oauth.calculatePKCECodeChallenge(
      ctx.state.session.code_verifier,
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

    ctx.state.session.redirectTo = ctx.url.href;
    return Response.redirect(authorizationUrl);
  },
];
