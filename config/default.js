const defer = require("config/defer").deferConfig;

module.exports = {
  server: {
    baseUrl: undefined,
    proxy: false,
  },
  oidc: {
    issuer: defer((cfg) => {
      if (!cfg.server.baseUrl) return undefined;
      return `${cfg.server.baseUrl}/oidc`;
    }),
    clients: [],
  },
};
