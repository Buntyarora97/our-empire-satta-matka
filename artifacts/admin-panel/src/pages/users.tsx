import { useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminGetUsers, getAdminGetUsersQueryKey, useAdminUpdateUserStatus, AdminUpdateUserStatusBodyStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, UserCheck, UserX, ChevronLeft, ChevronRight } from "lucide-react";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    blocked: "bg-red-500/10 text-red-400 border-red-500/20",
    suspended: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  return map[status] || "bg-gray-500/10 text-gray-400";
}

export default function Users() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const params = { page, limit: 20, search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined };
  const { data, isLoading } = useAdminGetUsers(params, { query: { queryKey: getAdminGetUsersQueryKey(params) } });
  const updateStatus = useAdminUpdateUserStatus();

  const handleStatus = (id: string, status: string) => {
    updateStatus.mutate({ id, data: { status: status as AdminUpdateUserStatusBodyStatus } }, {
      onSuccess: () => {
        toast({ title: `User ${status}` });
        qc.invalidateQueries({ queryKey: getAdminGetUsersQueryKey(params) });
      },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight">Users</h1>
          <div className="text-sm text-[#a0a0a0]">{data?.total || 0} total users</div>
        </div>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader className="pb-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#a0a0a0]" />
                <Input
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 bg-[#111111] border-[#2a2a2a] text-white"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36 bg-[#111111] border-[#2a2a2a] text-white" data-testid="select-user-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-[#a0a0a0]">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      {["Name", "Phone", "Balance", "Status", "Bets", "Joined", "Actions"].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-[#a0a0a0] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.users || []).map((user: any) => (
                      <tr key={user.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#111111] transition-colors" data-testid={`row-user-${user.id}`}>
                        <td className="py-3 px-4 text-white font-medium">{user.fullName}</td>
                        <td className="py-3 px-4 text-[#a0a0a0]">{user.phone}</td>
                        <td className="py-3 px-4 text-[#bfdb81] font-mono">₹{Number(user.balance).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs border ${statusBadge(user.status)}`}>{user.status}</span>
                        </td>
                        <td className="py-3 px-4 text-[#a0a0a0]">{user.totalBets}</td>
                        <td className="py-3 px-4 text-[#a0a0a0]">{new Date(user.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#48723e] hover:bg-[#48723e]/10" onClick={() => setLocation(`/users/${user.id}`)} data-testid={`button-view-user-${user.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {user.status === "active" ? (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:bg-red-400/10" onClick={() => handleStatus(user.id, "blocked")} data-testid={`button-block-user-${user.id}`}>
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400 hover:bg-green-400/10" onClick={() => handleStatus(user.id, "active")} data-testid={`button-unblock-user-${user.id}`}>
                                <UserCheck className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(data?.users?.length ?? 0) === 0 && (
                  <div className="text-center py-12 text-[#a0a0a0]">No users found</div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2a2a]">
              <Button variant="ghost" size="sm" className="text-[#a0a0a0]" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-[#a0a0a0]">Page {page} / {data?.totalPages || 1}</span>
              <Button variant="ghost" size="sm" className="text-[#a0a0a0]" disabled={page >= (data?.totalPages || 1)} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
