import { type Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import daisyui from "daisyui";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  plugins: [
    typography,
    // deno-lint-ignore no-explicit-any
    daisyui as any,
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
        },
      },
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
        },
      },
    ],
  },
} satisfies Config;
