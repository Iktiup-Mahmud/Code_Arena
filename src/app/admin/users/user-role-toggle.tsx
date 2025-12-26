"use client";

import { useState } from "react";
import { updateUserRole } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserRoleToggleProps {
  userId: string;
  currentRole: "USER" | "ADMIN";
}

export function UserRoleToggle({ userId, currentRole }: UserRoleToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRoleChange = async (newRole: "USER" | "ADMIN") => {
    if (currentRole === newRole) return;

    setIsLoading(true);
    try {
      await updateUserRole(userId, newRole);
      router.refresh();
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className="hover:bg-slate-800"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleRoleChange("USER")}
          disabled={currentRole === "USER"}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          Set as User
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleRoleChange("ADMIN")}
          disabled={currentRole === "ADMIN"}
          className="cursor-pointer"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Set as Admin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
