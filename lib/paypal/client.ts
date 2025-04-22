import checkoutNodeSdk from "@paypal/checkout-server-sdk";

export type PayPalEnvironmentConfig = {
  clientId: string;
  clientSecret: string;
  mode: "sandbox" | "live";
};

// Default environment using app-level credentials
const defaultEnv = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  mode: (process.env.NODE_ENV === "production" ? "live" : "sandbox") as
    | "sandbox"
    | "live",
};

// Create an environment based on config
export const createEnvironment = (config: PayPalEnvironmentConfig) => {
  const Environment =
    config.mode === "live"
      ? checkoutNodeSdk.core.LiveEnvironment
      : checkoutNodeSdk.core.SandboxEnvironment;

  return new Environment(config.clientId, config.clientSecret);
};

// Create a client with default app-level credentials
export const createPayPalClient = (
  config: PayPalEnvironmentConfig = defaultEnv,
) => {
  const environment = createEnvironment(config);
  return new checkoutNodeSdk.core.PayPalHttpClient(environment);
};

// Default client using app-level credentials
const paypalClient = createPayPalClient();

export default paypalClient;
