// @ts-types="npm:@types/oidc-provider"
import Provider from "oidc-provider";
const configuration = {
  // refer to the documentation for other available configuration
  clients: [{
    client_id: "foo",
    client_secret: "bar",
    redirect_uris: ["http://lvh.me:8080/cb"],
    // ... other client properties
  }],
};

const oidc = new Provider("http://localhost:8000", configuration);
oidc.proxy = true;

export const oidcServer = await new Promise<ReturnType<typeof oidc.listen>>(
  (resolve) => {
    const server = oidc.listen(3000, () => {
      console.log(
        "oidc-provider listening on port 3000, check http://localhost:3000/.well-known/openid-configuration",
      );
      resolve(server);
    });
  },
);
