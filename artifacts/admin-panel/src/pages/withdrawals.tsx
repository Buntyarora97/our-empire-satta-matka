import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAdminGetWithdrawals, useAdminCompleteWithdrawal, useAdminRejectWithdrawal, getAdminGetWithdrawalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function Withdrawals() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const params = { status: activeTab, page };
  const { data, isLoading } = useAdminGetWithdrawals(params, { query: { queryKey: getAdminGetWithdrawalsQueryKey(params) } });
  const complete = useAdminCompleteWithdrawal();
  const reject = useAdminRejectWithdrawal();

  const handleComplete = (id: string) => {
    complete.mutate({ id }, {
      onSuccess: () => { toast({ title: "Withdrawal completed" }); qc.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey(params) }); },
    });
  };

  const handleReject = () => {
    reject.mutate({ id: rejectId, data: { reason: rejectReason } }, {
      onSuccess: () => { toast({ title: "Withdrawal rejected, amount refunded" }); qc.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey(params) }); setRejectOpen(false); setRejectReason(""); },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Withdrawal Requests</h1>

        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setPage(1); }}>
          <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
            {["pending", "completed", "rejected"].map(t => (
              <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-[#48723e] data-[state=active]:text-white" data-testid={`tab-withdrawals-${t}`}>{t}</TabsTrigger>
            ))}
          </TabsList>

          {["pending", "completed", "rejected"].map(tab => (
            <TabsContent key={tab} value={tab}>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="pt-4">
                  {isLoading ? <div className="text-center py-12 text-[#a0a0a0]">Loading...</div> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#2a2a2a]">
                            {["User", "Amount", "Method", "Bank/UPI Details", "Status", "Date", "Actions"].map(h => (
                              <th key={h} className="text-left py-3 px-4 text-[#a0a0a0] font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.transactions || []).map((t: any) => (
                            <tr key={t.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#111111]" data-testid={`row-withdrawal-${t.id}`}>
                              <td className="py-3 px-4 text-white font-medium">{t.userName}</td>
                              <td className="py-3 px-4 text-[#bfdb81] font-mono font-bold">₹{Number(t.amount).toLocaleString("en-IN")}</td>
                              <td className="py-3 px-4 text-[#a0a0a0] capitalize">{t.method}</td>
                              <td className="py-3 px-4 text-[#a0a0a0] text-xs max-w-[200px] truncate">
                                {t.bankDetails ? (typeof t.bankDetails === "object" ? JSON.stringify(t.bankDetails) : t.bankDetails) : "-"}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-xs ${t.status === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" : t.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}>{t.status}</span>
                              </td>
                              <td className="py-3 px-4 text-[#a0a0a0]">{new Date(t.createdAt).toLocaleDateString("en-IN")}</td>
                              <td className="py-3 px-4">
                                {t.status === "pending" && (
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-green-400 hover:bg-green-400/10" onClick={() => handleComplete(t.id)} data-testid={`button-complete-withdrawal-${t.id}`}>
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:bg-red-400/10" onClick={() => { setRejectId(t.id); setRejectOpen(true); }} data-testid={`button-reject-withdrawal-${t.id}`}>
                                      <XCircle className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(data?.transactions?.length ?? 0) === 0 && <div className="text-center py-8 text-[#a0a0a0]">No {tab} withdrawals</div>}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2a2a]">
                    <Button variant="ghost" size="sm" className="text-[#a0a0a0]" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev"><ChevronLeft className="h-4 w-4" /> Prev</Button>
                    <span className="text-sm text-[#a0a0a0]">Page {page} / {data?.totalPages || 1}</span>
                    <Button variant="ghost" size="sm" className="text-[#a0a0a0]" disabled={page >= (data?.totalPages || 1)} onClick={() => setPage(p => p + 1)} data-testid="button-next">Next <ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader><DialogTitle>Reject Withdrawal</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="bg-[#111111] border-[#2a2a2a] text-white" data-testid="input-reject-reason" />
          <Button className="bg-red-600/80 hover:bg-red-600 text-white" onClick={handleReject} disabled={reject.isPending} data-testid="button-confirm-reject">Confirm Reject</Button>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
