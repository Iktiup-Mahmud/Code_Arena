"use client";

import PusherClient from "pusher-js";

// Client-side Pusher instance (for subscribing to channels)
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
        // Enable client events for real-time collaboration
        channelAuthorization: {
          endpoint: "/api/pusher/auth",
          transport: "ajax",
        },
      }
    );

    // Add connection event listeners for debugging
    pusherClientInstance.connection.bind("connected", () => {
      console.log("[Pusher] Connected successfully");
    });

    pusherClientInstance.connection.bind("disconnected", () => {
      console.log("[Pusher] Disconnected");
    });

    pusherClientInstance.connection.bind("error", (err: unknown) => {
      console.error("[Pusher] Connection error:", err);
    });
  }
  return pusherClientInstance;
}

// Cleanup function for when the app unmounts
export function disconnectPusher(): void {
  if (pusherClientInstance) {
    pusherClientInstance.disconnect();
    pusherClientInstance = null;
  }
}

export default getPusherClient;
