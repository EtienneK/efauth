const os = require("os");
const defer = require("config/defer").deferConfig;

const hostname = os.hostname();

module.exports = {
  server: {
    baseUrl: `https://${hostname}`,
    proxy: false,
  },
  oidc: {
    issuer: defer((cfg) => `${cfg.server.baseUrl}/api/oidc`),
    clients: [],
  },
};
