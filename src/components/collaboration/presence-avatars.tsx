"use client";

import { useRoom } from "./room-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PresenceAvatars() {
  const { connectedUsers, currentUser } = useRoom();

  // Filter out current user and show others
  const otherUsers = connectedUsers.filter(
    (user) => user.id !== currentUser?.id
  );

  if (otherUsers.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Only you in this room
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <div className="flex -space-x-2">
          {otherUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <Avatar
                  className="h-8 w-8 border-2 border-slate-800 cursor-pointer transition-transform hover:scale-110 hover:z-10"
                  style={{ borderColor: user.color }}
                >
                  <AvatarFallback
                    style={{ backgroundColor: user.color }}
                    className="text-xs font-medium text-white"
                  >
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {otherUsers.length > 5 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-300 border-2 border-slate-800">
                +{otherUsers.length - 5}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{otherUsers.length - 5} more users</p>
            </TooltipContent>
          </Tooltip>
        )}

        <span className="ml-2 text-sm text-slate-400">
          {otherUsers.length} collaborator{otherUsers.length !== 1 ? "s" : ""}
        </span>
      </div>
    </TooltipProvider>
  );
}

