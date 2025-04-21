declare module "@paypal/checkout-server-sdk" {
  namespace core {
    class PayPalHttpClient {
      constructor(environment: Environment);
      execute<T>(request: any): Promise<{ result: T }>;
      orders: typeof orders;
    }

    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }

    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }

    interface Environment {}
  }

  namespace orders {
    class OrdersCreateRequest {
      constructor();
      prefer(prefer: string): void;
      requestBody(body: any): void;
    }

    class OrdersGetRequest {
      constructor(orderId: string);
      prefer(prefer: string): void;
    }

    class OrdersCaptureRequest {
      constructor(orderId: string);
      prefer(prefer: string): void;
    }
  }

  export default {
    core,
    orders,
  };
}
