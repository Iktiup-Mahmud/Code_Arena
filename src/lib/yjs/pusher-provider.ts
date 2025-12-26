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
    this.channel = this.pusher.subscribe(channelName) as PresenceChannel;

    this.channel.bind("pusher:subscription_succeeded", () => {
      this.connected = true;
      this.requestSync();
    });

    this.channel.bind("pusher:member_added", () => {
      // When a new member joins, send them our current state
      this.broadcastState();
    });

    this.channel.bind("pusher:member_removed", (member: { id: string }) => {
      // Remove awareness state for disconnected user
      const states = this.awareness.getStates();
      states.forEach((state) => {
        if (state.user?.id === member.id) {
          this.awareness.setLocalStateField("user", null);
        }
      });
    });

    // Listen for sync messages
    this.channel.bind("client-sync", (data: { message: number[] }) => {
      this.handleMessage(new Uint8Array(data.message));
    });

    // Listen for awareness updates
    this.channel.bind("client-awareness", (data: { message: number[] }) => {
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
    // Send our full state
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep2(encoder, this.doc);
    this.broadcastMessage(encoding.toUint8Array(encoder));

    // Also broadcast awareness
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
        this.synced = true;
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
      this.channel.trigger("client-sync", {
        message: Array.from(message),
      });
    }
  }

  private broadcastAwareness(message: Uint8Array) {
    if (this.channel && this.connected) {
      this.channel.trigger("client-awareness", {
        message: Array.from(message),
      });
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
