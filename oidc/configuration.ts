// @ts-types="npm:@types/oidc-provider"
import { ClientMetadata, Configuration } from "oidc-provider";
import db from "../db/db.ts";
import { secureRandom } from "../utils/credentials.ts";
import { config } from "../utils/config.ts";

export function createConfiguration({ baseUrl }: { baseUrl: URL }) {
  const staticClients: ClientMetadata[] = [
    {
      client_id: "admin",
      client_secret: secureRandom(),
      redirect_uris: [new URL("/admin/api/oidc/callback", baseUrl).href],
      token_endpoint_auth_method: "client_secret_basic",
    },
  ];
  staticClients.push(...config().oidc.clients);

  const configuration: Configuration = {
    findAccount: async (_ctx, sub, _token) => {
      const found = await db.users.find(sub);
      if (!found) return undefined;
      return {
        accountId: sub,
        claims(_use, _scope, _claims, _rejected) {
          return { sub };
        },
      };
    },
    adapter: db.oidc,
    clients: staticClients,
    interactions: {
      url(_ctx, interaction) {
        return `/interactions/${interaction.uid}`;
      },
    },
    async loadExistingGrant(ctx) {
      // TODO: Implement consent or make it skippable based on config. For now, just skip it
      // See: https://github.com/panva/node-oidc-provider/blob/main/recipes/skip_consent.md
      const grantId = ctx.oidc.result?.consent?.grantId ||
        ctx.oidc.session!.grantIdFor(ctx.oidc.client!.clientId);

      if (grantId) {
        // keep grant expiry aligned with session expiry
        // to prevent consent prompt being requested when grant expires
        const grant = await ctx.oidc.provider.Grant.find(grantId);

        // this aligns the Grant ttl with that of the current session
        // if the same Grant is used for multiple sessions, or is set
        // to never expire, you probably do not want this in your code
        if (ctx.oidc.account && grant!.exp! < ctx.oidc.session!.exp) {
          grant!.exp = ctx.oidc.session!.exp;

          await grant!.save();
        }

        return grant;
      } /* if (isFirstParty(ctx.oidc.client)) */ else {
        const grant = new ctx.oidc.provider.Grant({
          clientId: ctx.oidc.client!.clientId,
          accountId: ctx.oidc.session!.accountId,
        });

        grant.addOIDCScope("openid");
        // grant.addOIDCClaims(["first_name"]);
        // grant.addResourceScope(
        //   "urn:example:resource-indicator",
        //   "api:read api:write",
        // );
        await grant.save();
        return grant;
      }
    },
    features: {
      backchannelLogout: { enabled: false },
      claimsParameter: { enabled: false },
      clientCredentials: { enabled: false },
      ciba: { enabled: false, deliveryModes: ["poll"] },
      dPoP: { enabled: false },
      devInteractions: { enabled: false },
      deviceFlow: { enabled: false },
      encryption: { enabled: false },
      fapi: { enabled: false, profile: undefined },
      introspection: { enabled: false },
      jwtIntrospection: { enabled: false },
      jwtResponseModes: { enabled: false },
      jwtUserinfo: { enabled: false },
      mTLS: { enabled: false },
      pushedAuthorizationRequests: { enabled: false },
      registration: { enabled: false },
      registrationManagement: { enabled: false },
      // requestObjects: {},
      resourceIndicators: { enabled: false },
      revocation: { enabled: false },
      // richAuthorizationRequests: { enabled: false },
      rpInitiatedLogout: { enabled: false },
      userinfo: { enabled: false },
    },
  };

  return configuration;
}
