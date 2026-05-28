import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdminGetMarkets, useAdminCreateMarket, useAdminUpdateMarket, useAdminToggleMarketStatus, getAdminGetMarketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Power, PowerOff } from "lucide-react";

function statusBadge(status: string) {
  if (status === "active") return "bg-green-500/10 text-green-400 border border-green-500/20";
  if (status === "inactive") return "bg-red-500/10 text-red-400 border border-red-500/20";
  return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
}

const emptyForm = { name: "", openTime: "", closeTime: "", minBet: "10", maxBet: "10000", payoutRatio: "90" };

export default function Markets() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useAdminGetMarkets({ query: { queryKey: getAdminGetMarketsQueryKey() } });
  const createMarket = useAdminCreateMarket();
  const updateMarket = useAdminUpdateMarket();
  const toggleStatus = useAdminToggleMarketStatus();

  const handleEdit = (m: any) => {
    setEditId(m.id);
    setForm({ name: m.name, openTime: m.openTime, closeTime: m.closeTime, minBet: String(m.minBet), maxBet: String(m.maxBet), payoutRatio: String(m.payoutRatio) });
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload = { name: form.name, openTime: form.openTime, closeTime: form.closeTime, minBet: Number(form.minBet), maxBet: Number(form.maxBet), payoutRatio: Number(form.payoutRatio) };
    if (editId) {
      updateMarket.mutate({ id: editId, data: payload }, {
        onSuccess: () => { toast({ title: "Market updated" }); qc.invalidateQueries({ queryKey: getAdminGetMarketsQueryKey() }); setOpen(false); setEditId(null); setForm(emptyForm); },
      });
    } else {
      createMarket.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "Market created" }); qc.invalidateQueries({ queryKey: getAdminGetMarketsQueryKey() }); setOpen(false); setForm(emptyForm); },
      });
    }
  };

  const handleToggle = (id: string, current: string) => {
    const status = current === "active" ? "inactive" : "active";
    toggleStatus.mutate({ id, data: { status } }, {
      onSuccess: () => { toast({ title: `Market ${status}` }); qc.invalidateQueries({ queryKey: getAdminGetMarketsQueryKey() }); },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Markets</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#1a4718] to-[#48723e] text-white" onClick={() => { setEditId(null); setForm(emptyForm); }} data-testid="button-add-market">
                <Plus className="h-4 w-4 mr-2" /> Add Market
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
              <DialogHeader><DialogTitle>{editId ? "Edit Market" : "Add Market"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {[["name", "Market Name", "text"], ["openTime", "Open Time (HH:MM)", "time"], ["closeTime", "Close Time (HH:MM)", "time"], ["minBet", "Min Bet (₹)", "number"], ["maxBet", "Max Bet (₹)", "number"], ["payoutRatio", "Payout Ratio (x)", "number"]].map(([key, label, type]) => (
                  <div key={key}>
                    <Label className="text-[#a0a0a0] text-sm">{label}</Label>
                    <Input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="bg-[#111111] border-[#2a2a2a] text-white mt-1" data-testid={`input-market-${key}`} />
                  </div>
                ))}
                <Button className="w-full bg-gradient-to-r from-[#1a4718] to-[#48723e]" onClick={handleSubmit} disabled={createMarket.isPending || updateMarket.isPending} data-testid="button-save-market">
                  {editId ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-3 text-center py-12 text-[#a0a0a0]">Loading...</div>
          ) : (data?.markets || []).map((m: any) => (
            <Card key={m.id} className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#48723e]/40 transition-colors" data-testid={`card-market-${m.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-white font-bold">{m.name}</CardTitle>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge(m.status)}`}>{m.status}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-[#a0a0a0]">Timing</span><span className="text-white">{m.openTime} - {m.closeTime}</span></div>
                  <div className="flex justify-between"><span className="text-[#a0a0a0]">Bet Range</span><span className="text-white">₹{m.minBet} - ₹{m.maxBet}</span></div>
                  <div className="flex justify-between"><span className="text-[#a0a0a0]">Payout</span><span className="text-[#bfdb81]">{m.payoutRatio}x</span></div>
                  <div className="flex justify-between"><span className="text-[#a0a0a0]">Betting</span><span className={m.isBettingOpen ? "text-green-400" : "text-red-400"}>{m.isBettingOpen ? "Open" : "Closed"}</span></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="flex-1 text-[#48723e] hover:bg-[#48723e]/10" onClick={() => handleEdit(m)} data-testid={`button-edit-market-${m.id}`}>
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className={`flex-1 ${m.status === "active" ? "text-red-400 hover:bg-red-400/10" : "text-green-400 hover:bg-green-400/10"}`} onClick={() => handleToggle(m.id, m.status)} data-testid={`button-toggle-market-${m.id}`}>
                    {m.status === "active" ? <><PowerOff className="h-3.5 w-3.5 mr-1" /> Disable</> : <><Power className="h-3.5 w-3.5 mr-1" /> Enable</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
