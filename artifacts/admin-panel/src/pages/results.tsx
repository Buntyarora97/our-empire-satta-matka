import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdminGetResults, useAdminAddResult, useAdminGetMarkets, getAdminGetResultsQueryKey, getAdminGetMarketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trophy } from "lucide-react";

const emptyForm = { marketId: "", date: new Date().toISOString().split("T")[0], openNumber: "", closeNumber: "", jodiNumber: "" };

export default function Results() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterMarket, setFilterMarket] = useState("all");

  const params = filterMarket !== "all" ? { marketId: filterMarket } : {};
  const { data, isLoading } = useAdminGetResults(params, { query: { queryKey: getAdminGetResultsQueryKey(params) } });
  const { data: marketsData } = useAdminGetMarkets({ query: { queryKey: getAdminGetMarketsQueryKey() } });
  const addResult = useAdminAddResult();

  const handleSubmit = () => {
    if (!form.marketId || !form.date) { toast({ title: "Market and date required", variant: "destructive" }); return; }
    addResult.mutate({ data: form }, {
      onSuccess: () => {
        toast({ title: "Result declared" });
        qc.invalidateQueries({ queryKey: getAdminGetResultsQueryKey({}) });
        setOpen(false);
        setForm(emptyForm);
      },
      onError: () => toast({ title: "Failed to add result", variant: "destructive" }),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">Results</h1>
          <div className="flex gap-3">
            <Select value={filterMarket} onValueChange={setFilterMarket}>
              <SelectTrigger className="w-44 bg-[#111111] border-[#2a2a2a] text-white" data-testid="select-filter-market">
                <SelectValue placeholder="All Markets" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="all">All Markets</SelectItem>
                {(marketsData?.markets || []).map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#1a4718] to-[#48723e] text-white" data-testid="button-add-result">
                  <Plus className="h-4 w-4 mr-2" /> Declare Result
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-[#48723e]" /> Declare Result</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#a0a0a0]">Market</Label>
                    <Select value={form.marketId} onValueChange={v => setForm(f => ({ ...f, marketId: v }))}>
                      <SelectTrigger className="bg-[#111111] border-[#2a2a2a] text-white mt-1" data-testid="select-result-market">
                        <SelectValue placeholder="Select Market" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {(marketsData?.markets || []).map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[#a0a0a0]">Date</Label>
                    <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-[#111111] border-[#2a2a2a] text-white mt-1" data-testid="input-result-date" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[["openNumber", "Open"], ["closeNumber", "Close"], ["jodiNumber", "Jodi"]].map(([key, label]) => (
                      <div key={key}>
                        <Label className="text-[#a0a0a0] text-xs">{label}</Label>
                        <Input maxLength={3} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="bg-[#111111] border-[#2a2a2a] text-white mt-1 text-center font-mono text-lg" data-testid={`input-${key}`} />
                      </div>
                    ))}
                  </div>
                  <Button className="w-full bg-gradient-to-r from-[#1a4718] to-[#48723e]" onClick={handleSubmit} disabled={addResult.isPending} data-testid="button-submit-result">
                    Declare & Settle Bets
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader><CardTitle className="text-white">Result History</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="text-center py-12 text-[#a0a0a0]">Loading...</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      {["Market", "Date", "Open", "Close", "Jodi", "Status"].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-[#a0a0a0] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.results || []).map((r: any) => (
                      <tr key={r.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#111111]" data-testid={`row-result-${r.id}`}>
                        <td className="py-3 px-4 text-white font-medium">{r.marketName}</td>
                        <td className="py-3 px-4 text-[#a0a0a0]">{r.date}</td>
                        <td className="py-3 px-4 font-mono text-[#bfdb81] text-lg">{r.openNumber || "-"}</td>
                        <td className="py-3 px-4 font-mono text-[#bfdb81] text-lg">{r.closeNumber || "-"}</td>
                        <td className="py-3 px-4 font-mono text-[#83a561] font-bold">{r.jodiNumber || "-"}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/20">{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(data?.results?.length ?? 0) === 0 && <div className="text-center py-8 text-[#a0a0a0]">No results declared yet</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
