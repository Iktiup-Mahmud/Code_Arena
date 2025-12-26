import { getAllUsers } from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, ShieldCheck, User as UserIcon } from "lucide-react";
import { UserRoleToggle } from "./user-role-toggle";

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-slate-400">Manage platform users</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2">
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-xs text-slate-400">Total Users</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">User</TableHead>
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400">Role</TableHead>
              <TableHead className="text-slate-400">Submissions</TableHead>
              <TableHead className="text-slate-400">Rooms Created</TableHead>
              <TableHead className="text-slate-400">Joined</TableHead>
              <TableHead className="text-slate-400 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-slate-500"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-slate-800 hover:bg-slate-800/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.username || user.email}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
                          <UserIcon className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white">
                          {user.username || "Anonymous"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">{user.email}</TableCell>
                  <TableCell>
                    {user.role === "ADMIN" ? (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/20 text-amber-400 border-amber-500/30"
                      >
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-slate-500/20 text-slate-400 border-slate-500/30"
                      >
                        <Users className="mr-1 h-3 w-3" />
                        User
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {user._count.submissions}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {user._count.createdRooms}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserRoleToggle userId={user.id} currentRole={user.role} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
