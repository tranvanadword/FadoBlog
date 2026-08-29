import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

config.buildCommand = "node ./node_modules/next/dist/bin/next build";

export default config;
