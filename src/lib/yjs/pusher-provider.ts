"use client";

import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import PusherClient, { PresenceChannel } from "pusher-js";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

export interface PusherProviderOptions {
  roomId: string;
  doc: Y.Doc;
  pusher: PusherClient;
  awareness?: Awareness;
}

export class PusherProvider {
  public doc: Y.Doc;
  public awareness: Awareness;
  public roomId: string;

  private pusher: PusherClient;
  private channel: PresenceChannel | null = null;
  private connected: boolean = false;
  private synced: boolean = false;

  constructor(options: PusherProviderOptions) {
    this.doc = options.doc;
    this.roomId = options.roomId;
    this.pusher = options.pusher;
    this.awareness = options.awareness || new Awareness(this.doc);

    this.connect();
  }

  private connect() {
    const channelName = `presence-room-${this.roomId}`;
    console.log(`[PusherProvider] Connecting to channel: ${channelName}`);

    this.channel = this.pusher.subscribe(channelName) as PresenceChannel;

    this.channel.bind("pusher:subscription_succeeded", (members: any) => {
      console.log(
        "[PusherProvider] Subscription succeeded. Members:",
        members.count
      );
      this.connected = true;
      // Request sync from existing members
      this.requestSync();
      // Broadcast our awareness state
      this.broadcastAwarenessState();
    });

    this.channel.bind("pusher:subscription_error", (status: any) => {
      console.error("[PusherProvider] Subscription error:", status);
    });

    this.channel.bind("pusher:member_added", (member: any) => {
      console.log("[PusherProvider] Member added:", member.id);
      // Send our current state to new member
      this.broadcastState();
    });

    this.channel.bind("pusher:member_removed", (member: { id: string }) => {
      console.log("[PusherProvider] Member removed:", member.id);
      // Remove awareness state for disconnected user
      const states = this.awareness.getStates();
      states.forEach((state, clientId) => {
        if (state.user?.id === member.id) {
          // Remove awareness for that client by setting it to null
          this.awareness.setLocalStateField("user", null);
        }
      });
    });

    // Listen for sync messages
    this.channel.bind("client-sync", (data: { message: number[] }) => {
      console.log(
        "[PusherProvider] Received sync message, length:",
        data.message.length
      );
      this.handleMessage(new Uint8Array(data.message));
    });

    // Listen for awareness updates
    this.channel.bind("client-awareness", (data: { message: number[] }) => {
      console.log("[PusherProvider] Received awareness update");
      this.handleAwarenessMessage(new Uint8Array(data.message));
    });

    // Set up document change listener
    this.doc.on("update", this.handleDocUpdate);

    // Set up awareness change listener
    this.awareness.on("update", this.handleAwarenessUpdate);
  }

  private requestSync() {
    // Send sync step 1 to request state from other clients
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, this.doc);
    this.broadcastMessage(encoding.toUint8Array(encoder));
  }

  private broadcastState() {
    console.log("[PusherProvider] Broadcasting full state");
    // Send our full state
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep2(encoder, this.doc);
    this.broadcastMessage(encoding.toUint8Array(encoder));

    // Also broadcast awareness
    this.broadcastAwarenessState();
  }

  private broadcastAwarenessState() {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        Array.from(this.awareness.getStates().keys())
      )
    );
    this.broadcastAwareness(encoding.toUint8Array(awarenessEncoder));
  }

  private handleMessage = (message: Uint8Array) => {
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    if (messageType === MESSAGE_SYNC) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);

      const syncMessageType = syncProtocol.readSyncMessage(
        decoder,
        encoder,
        this.doc,
        this
      );

      if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
        console.log("[PusherProvider] Sync completed (Step 2)");
        this.synced = true;
      } else if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
        console.log("[PusherProvider] Sync Step 1 received");
      }

      if (encoding.length(encoder) > 1) {
        this.broadcastMessage(encoding.toUint8Array(encoder));
      }
    }
  };

  private handleAwarenessMessage = (message: Uint8Array) => {
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    if (messageType === MESSAGE_AWARENESS) {
      awarenessProtocol.applyAwarenessUpdate(
        this.awareness,
        decoding.readVarUint8Array(decoder),
        this
      );
    }
  };

  private handleDocUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === this) return; // Don't broadcast our own updates

    console.log("[PusherProvider] Document updated, broadcasting...");
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    this.broadcastMessage(encoding.toUint8Array(encoder));
  };

  private handleAwarenessUpdate = (
    {
      added,
      updated,
      removed,
    }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ) => {
    if (origin === this) return;

    const changedClients = added.concat(updated).concat(removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
    );
    this.broadcastAwareness(encoding.toUint8Array(encoder));
  };

  private broadcastMessage(message: Uint8Array) {
    if (this.channel && this.connected) {
      try {
        this.channel.trigger("client-sync", {
          message: Array.from(message),
        });
        console.log("[PusherProvider] Broadcasted sync message");
      } catch (error) {
        console.error("[PusherProvider] Error broadcasting sync:", error);
      }
    } else {
      console.warn("[PusherProvider] Cannot broadcast - not connected");
    }
  }

  private broadcastAwareness(message: Uint8Array) {
    if (this.channel && this.connected) {
      try {
        this.channel.trigger("client-awareness", {
          message: Array.from(message),
        });
        console.log("[PusherProvider] Broadcasted awareness update");
      } catch (error) {
        console.error("[PusherProvider] Error broadcasting awareness:", error);
      }
    } else {
      console.warn(
        "[PusherProvider] Cannot broadcast awareness - not connected"
      );
    }
  }

  public setAwarenessField(field: string, value: unknown) {
    this.awareness.setLocalStateField(field, value);
  }

  public destroy() {
    this.doc.off("update", this.handleDocUpdate);
    this.awareness.off("update", this.handleAwarenessUpdate);

    if (this.channel) {
      this.channel.unbind_all();
      this.pusher.unsubscribe(`presence-room-${this.roomId}`);
    }

    this.awareness.destroy();
    this.connected = false;
  }

  public get isConnected() {
    return this.connected;
  }

  public get isSynced() {
    return this.synced;
  }
}
