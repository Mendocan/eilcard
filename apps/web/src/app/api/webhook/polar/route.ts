import { Webhooks } from "@polar-sh/nextjs";
import { syncPolarSubscription } from "@/lib/subscription-sync";

const webhookSecret = process.env.POLAR_WEBHOOK_SECRET?.trim();

export const POST = webhookSecret
  ? Webhooks({
      webhookSecret,
      onSubscriptionActive: async (payload) => {
        await syncPolarSubscription(payload.data);
      },
      onSubscriptionUpdated: async (payload) => {
        await syncPolarSubscription(payload.data);
      },
      onSubscriptionCanceled: async (payload) => {
        await syncPolarSubscription({ ...payload.data, status: "canceled" });
      },
      onSubscriptionRevoked: async (payload) => {
        await syncPolarSubscription({ ...payload.data, status: "revoked" });
      },
      onSubscriptionUncanceled: async (payload) => {
        await syncPolarSubscription({ ...payload.data, status: "active" });
      },
    })
  : async () =>
      new Response(JSON.stringify({ error: "Polar webhooks not configured" }), {
        status: 503,
      });
