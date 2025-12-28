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
  problemId?: string | null; // Scope collaboration to specific problem
  children: ReactNode;
}

export function RoomProvider({
  roomId,
  problemId,
  children,
}: RoomProviderProps) {
  const [doc, setDoc] = useState(() => new Y.Doc());
  const [awareness, setAwareness] = useState(() => new Awareness(doc));
  const [provider, setProvider] = useState<PusherProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Track connected users from awareness
  useEffect(() => {
    if (!awareness) return;

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

  // Initialize provider - recreate when problem changes
  useEffect(() => {
    console.log(
      "[RoomProvider] Initializing for room:",
      roomId,
      "problem:",
      problemId
    );

    // Create new Y.js doc and awareness for this problem
    const newDoc = new Y.Doc();
    const newAwareness = new Awareness(newDoc);
    setDoc(newDoc);
    setAwareness(newAwareness);

    const pusher = getPusherClient();

    const newProvider = new PusherProvider({
      roomId,
      problemId,
      doc: newDoc,
      pusher,
      awareness: newAwareness,
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
      newDoc.destroy();
      // Don't disconnect pusher globally - other components might use it
    };
  }, [roomId, problemId]);

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
