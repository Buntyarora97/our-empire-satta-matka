import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminGetBets, useAdminGetMarkets, useAdminCancelBet, getAdminGetBetsQueryKey, getAdminGetMarketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Ban, ChevronLeft, ChevronRight } from "lucide-react";

function betStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    won: "bg-green-500/10 text-green-400 border border-green-500/20",
    lost: "bg-red-500/10 text-red-400 border border-red-500/20",
    cancelled: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  };
  return map[status] || "bg-gray-500/10 text-gray-400";
}

export default function Bets() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [market, setMarket] = useState("all");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const params: any = { page };
  if (market !== "all") params.market = market;
  if (status !== "all") params.status = status;
  if (date) params.date = date;

  const { data, isLoading } = useAdminGetBets(params, { query: { queryKey: getAdminGetBetsQueryKey(params) } });
  const { data: marketsData } = useAdminGetMarkets({ query: { queryKey: getAdminGetMarketsQueryKey() } });
  const cancelBet = useAdminCancelBet();

  const handleCancel = (id: string) => {
    cancelBet.mutate({ id }, {
      onSuccess: () => { toast({ title: "Bet cancelled" }); qc.invalidateQueries({ queryKey: getAdminGetBetsQueryKey(params) }); },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Bets</h1>
          <div className="text-sm text-[#a0a0a0]">{data?.total || 0} total bets</div>
        </div>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader className="pb-4">
            <div className="flex gap-3 flex-wrap">
              <Select value={market} onValueChange={v => { setMarket(v); setPage(1); }}>
                <SelectTrigger className="w-44 bg-[#111111] border-[#2a2a2a] text-white" data-testid="select-bet-market">
                  <SelectValue placeholder="All Markets" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="all">All Markets</SelectItem>
                  {(marketsData?.markets || []).map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-36 bg-[#111111] border-[#2a2a2a] text-white" data-testid="select-bet-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1); }} className="w-40 bg-[#111111] border-[#2a2a2a] text-white" data-testid="input-bet-date" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="text-center py-12 text-[#a0a0a0]">Loading...</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      {["Market", "User", "Type", "Amount", "Status", "Win Amount", "Date", "Action"].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-[#a0a0a0] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.bets || []).map((b: any) => (
                      <tr key={b.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#111111]" data-testid={`row-bet-${b.id}`}>
                        <td className="py-3 px-3 text-white font-medium">{b.marketName}</td>
                        <td className="py-3 px-3 text-[#a0a0a0] text-xs">{b.userId?.slice(0, 8)}</td>
                        <td className="py-3 px-3 text-[#a0a0a0]">{b.gameType}</td>
                        <td className="py-3 px-3 text-[#bfdb81] font-mono">₹{b.totalAmount}</td>
                        <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-xs ${betStatusBadge(b.status)}`}>{b.status}</span></td>
                        <td className="py-3 px-3 text-green-400 font-mono">{b.winAmount > 0 ? `₹${b.winAmount}` : "-"}</td>
                        <td className="py-3 px-3 text-[#a0a0a0]">{new Date(b.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="py-3 px-3">
                          {b.status === "pending" && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:bg-red-400/10" onClick={() => handleCancel(b.id)} data-testid={`button-cancel-bet-${b.id}`}>
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(data?.bets?.length ?? 0) === 0 && <div className="text-center py-8 text-[#a0a0a0]">No bets found</div>}
              </div>
            )}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2a2a]">
              <Button variant="ghost" size="sm" className="text-[#a0a0a0]" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev"><ChevronLeft className="h-4 w-4" /> Prev</Button>
              <span className="text-sm text-[#a0a0a0]">Page {page} / {data?.totalPages || 1}</span>
              <Button variant="ghost" size="sm" className="text-[#a0a0a0]" disabled={page >= (data?.totalPages || 1)} onClick={() => setPage(p => p + 1)} data-testid="button-next">Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
