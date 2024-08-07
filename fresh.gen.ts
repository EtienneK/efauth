// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $api_oidc_oidc_ from "./routes/api/oidc/[...oidc].ts";
import * as $api_trpc_path_ from "./routes/api/trpc/[...path].ts";
import * as $index from "./routes/index.tsx";
import * as $interactions_uid_index from "./routes/interactions/[uid]/index.tsx";
import * as $interactions_uid_login from "./routes/interactions/[uid]/login.tsx";
import * as $Counter from "./islands/Counter.tsx";
import * as $UsernamePassword from "./islands/UsernamePassword.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/api/oidc/[...oidc].ts": $api_oidc_oidc_,
    "./routes/api/trpc/[...path].ts": $api_trpc_path_,
    "./routes/index.tsx": $index,
    "./routes/interactions/[uid]/index.tsx": $interactions_uid_index,
    "./routes/interactions/[uid]/login.tsx": $interactions_uid_login,
  },
  islands: {
    "./islands/Counter.tsx": $Counter,
    "./islands/UsernamePassword.tsx": $UsernamePassword,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
