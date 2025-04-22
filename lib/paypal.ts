/**
 * Utility functions for interacting with PayPal APIs
 */

import { db } from "@/db";
import { subscriptions as subscriptionsTable } from "@/db/schema";

/**
 * Gets an access token from PayPal for API operations
 */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(
    `${process.env.PAYPAL_API_URL}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("PayPal OAuth error:", errorData);
    throw new Error("Failed to get PayPal access token");
  }

  const { access_token } = await response.json();
  return access_token;
}

/**
 * Creates a subscription plan in PayPal
 */
export async function createSubscriptionPlan(
  productId: string,
  name: string,
  description: string,
  billingCycles: any[],
  paymentPreferences: any,
): Promise<any> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${process.env.PAYPAL_API_URL}/v1/billing/plans`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        product_id: productId,
        name,
        description,
        status: "ACTIVE",
        billing_cycles: billingCycles,
        payment_preferences: paymentPreferences,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("PayPal plan creation error:", errorData);
    throw new Error("Failed to create subscription plan");
  }

  return response.json();
}

/**
 * Creates a product in PayPal (needed for subscription plans)
 */
export async function createProduct(
  name: string,
  description: string,
  type: string = "SERVICE",
  category: string = "SOFTWARE",
): Promise<any> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${process.env.PAYPAL_API_URL}/v1/catalogs/products`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name,
        description,
        type,
        category,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("PayPal product creation error:", errorData);
    throw new Error("Failed to create product");
  }

  return response.json();
}

/**
 * Gets all subscriptions for the merchant from PayPal
 */
export async function getAllSubscriptions(): Promise<any[]> {
  console.log("getAllSubscriptions: Fetching PayPal access token");
  const accessToken = await getPayPalAccessToken();

  // First try the standard API endpoint
  try {
    console.log("getAllSubscriptions: Trying standard list endpoint");
    const url = `${process.env.PAYPAL_API_URL}/v1/billing/subscriptions?status=ACTIVE&status=SUSPENDED&status=CANCELLED&total_required=true`;
    console.log(`getAllSubscriptions: Calling ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log(
      `getAllSubscriptions: Standard list endpoint response status: ${response.status}`,
    );
    if (response.ok) {
      const responseText = await response.text();
      console.log(
        `getAllSubscriptions: Standard list endpoint raw response: ${responseText}`,
      );

      if (responseText) {
        const data = JSON.parse(responseText);
        console.log(
          `getAllSubscriptions: Standard list endpoint parsed response:`,
          data,
        );

        if (data.subscriptions && data.subscriptions.length > 0) {
          console.log(
            `getAllSubscriptions: Found ${data.subscriptions.length} subscriptions via standard endpoint`,
          );
          return data.subscriptions;
        } else {
          console.log(
            "getAllSubscriptions: No subscriptions found in standard endpoint response",
          );
        }
      } else {
        console.log(
          "getAllSubscriptions: Empty response from standard endpoint",
        );
      }
    } else {
      console.log(
        `getAllSubscriptions: Standard list endpoint failed with status ${response.status}`,
      );
      try {
        const errorText = await response.text();
        console.log(`getAllSubscriptions: Error response: ${errorText}`);
      } catch (textError) {
        console.log("getAllSubscriptions: Could not read error response text");
      }
    }
  } catch (error) {
    console.error(
      "getAllSubscriptions: Error getting subscriptions via list endpoint:",
      error,
    );
  }

  // If the first attempt fails, try a different approach with search
  try {
    console.log("getAllSubscriptions: Trying alternative search endpoint");
    const url = `${process.env.PAYPAL_API_URL}/v1/billing/subscriptions?fields=all`;
    console.log(`getAllSubscriptions: Calling ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "PayPal-Request-Id": `search-${Date.now()}`,
      },
    });

    console.log(
      `getAllSubscriptions: Search endpoint response status: ${response.status}`,
    );
    if (response.ok) {
      const responseText = await response.text();
      console.log(
        `getAllSubscriptions: Search endpoint raw response: ${responseText}`,
      );

      if (responseText) {
        const data = JSON.parse(responseText);
        console.log(
          `getAllSubscriptions: Search endpoint parsed response:`,
          data,
        );

        if (data.subscriptions && data.subscriptions.length > 0) {
          console.log(
            `getAllSubscriptions: Found ${data.subscriptions.length} subscriptions via search endpoint`,
          );
          return data.subscriptions;
        } else {
          console.log(
            "getAllSubscriptions: No subscriptions found in search endpoint response",
          );
        }
      } else {
        console.log("getAllSubscriptions: Empty response from search endpoint");
      }
    } else {
      console.log(
        `getAllSubscriptions: Search endpoint failed with status ${response.status}`,
      );
      try {
        const errorText = await response.text();
        console.log(`getAllSubscriptions: Error response: ${errorText}`);
      } catch (textError) {
        console.log("getAllSubscriptions: Could not read error response text");
      }
    }
  } catch (error) {
    console.error(
      "getAllSubscriptions: Error getting subscriptions via search:",
      error,
    );
  }

  console.log(
    "getAllSubscriptions: All attempts failed, returning empty array",
  );
  // If no subscriptions are found through the API, return an empty array
  return [];
}

/**
 * Fetches a subscription directly by ID
 */
export async function getSubscriptionById(
  subscriptionId: string,
  accessToken: string,
): Promise<any> {
  try {
    console.log(`getSubscriptionById: Fetching subscription ${subscriptionId}`);

    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    console.log(`getSubscriptionById: Response status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(
        `getSubscriptionById: Successfully fetched subscription ${subscriptionId}`,
      );
      return data;
    } else {
      console.log(
        `getSubscriptionById: Failed to fetch subscription ${subscriptionId}, status: ${response.status}`,
      );
      return null;
    }
  } catch (error) {
    console.error(
      `getSubscriptionById: Error fetching subscription ${subscriptionId}:`,
      error,
    );
    return null;
  }
}

/**
 * Gets known subscriptions when API methods fail
 */
export async function getFallbackSubscriptions(): Promise<any[]> {
  console.log(
    "PayPal: Attempting to fetch subscriptions from database as fallback",
  );

  try {
    // Get subscription IDs from database instead of hardcoding them
    const storedSubscriptions = await db
      .select()
      .from(subscriptionsTable)
      .limit(10); // Limit to 10 most recent subscriptions

    if (storedSubscriptions.length === 0) {
      console.log("PayPal: No subscriptions found in database for fallback");
      return [];
    }

    const accessToken = await getPayPalAccessToken();
    const subscriptions = [];

    for (const storedSub of storedSubscriptions) {
      try {
        const subscription = await getSubscriptionById(
          storedSub.subscriptionId,
          accessToken,
        );
        if (subscription) {
          subscriptions.push(subscription);
        }
      } catch (error) {
        console.error(
          `PayPal: Error fetching fallback subscription ${storedSub.subscriptionId}:`,
          error,
        );
      }
    }

    console.log(
      `PayPal: Found ${subscriptions.length} subscriptions via database fallback`,
    );
    return subscriptions;
  } catch (error) {
    console.error("PayPal: Error in fallback subscription retrieval:", error);
    return [];
  }
}
