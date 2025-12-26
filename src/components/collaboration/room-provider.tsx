"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { getPusherClient, disconnectPusher } from "@/lib/pusher/client";
import { PusherProvider } from "@/lib/yjs/pusher-provider";

interface User {
  id: string;
  name: string;
  color: string;
}

interface RoomContextType {
  doc: Y.Doc | null;
  awareness: Awareness | null;
  provider: PusherProvider | null;
  isConnected: boolean;
  isSynced: boolean;
  connectedUsers: User[];
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
}

const RoomContext = createContext<RoomContextType>({
  doc: null,
  awareness: null,
  provider: null,
  isConnected: false,
  isSynced: false,
  connectedUsers: [],
  currentUser: null,
  setCurrentUser: () => {},
});

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}

interface RoomProviderProps {
  roomId: string;
  children: ReactNode;
}

export function RoomProvider({ roomId, children }: RoomProviderProps) {
  const [doc] = useState(() => new Y.Doc());
  const [awareness] = useState(() => new Awareness(doc));
  const [provider, setProvider] = useState<PusherProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Track connected users from awareness
  useEffect(() => {
    const updateUsers = () => {
      const users: User[] = [];
      awareness.getStates().forEach((state) => {
        if (state.user) {
          users.push(state.user as User);
        }
      });
      setConnectedUsers(users);
    };

    awareness.on("change", updateUsers);
    updateUsers();

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [awareness]);

  // Initialize provider
  useEffect(() => {
    const pusher = getPusherClient();

    const newProvider = new PusherProvider({
      roomId,
      doc,
      pusher,
      awareness,
    });

    setProvider(newProvider);

    // Poll connection status
    const checkStatus = setInterval(() => {
      setIsConnected(newProvider.isConnected);
      setIsSynced(newProvider.isSynced);
    }, 500);

    return () => {
      clearInterval(checkStatus);
      newProvider.destroy();
      // Don't disconnect pusher globally - other components might use it
    };
  }, [roomId, doc, awareness]);

  // Update awareness when current user changes
  useEffect(() => {
    if (currentUser) {
      awareness.setLocalStateField("user", currentUser);
    }
  }, [currentUser, awareness]);

  const value: RoomContextType = {
    doc,
    awareness,
    provider,
    isConnected,
    isSynced,
    connectedUsers,
    currentUser,
    setCurrentUser,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

// Hook to cleanup pusher on app unmount
export function usePusherCleanup() {
  useEffect(() => {
    return () => {
      disconnectPusher();
    };
  }, []);
}
