import { createFileRoute } from "@tanstack/react-router";
import { Search, Users } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-neon">Directory</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-display font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          User management layout. Connect an authenticated admin API to load and manage accounts.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            aria-label="Search users"
            className="w-full min-h-[40px] rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-neon"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter users by role"
          className="min-h-[40px] rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-neon"
        >
          <option value="all">All roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table Shell */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Joined</th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="p-10 text-center space-y-2">
          <Users className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">No user records loaded</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            User rows are intentionally empty in this frontend-only structure. Wire your server-side
            user listing endpoint to populate this table.
          </p>
        </div>
      </div>
    </div>
  );
}
