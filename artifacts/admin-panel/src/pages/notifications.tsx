import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminSendNotification, useAdminGetNotificationHistory, getAdminGetNotificationHistoryQueryKey, SendNotificationRequestType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send } from "lucide-react";

export default function Notifications() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("all");

  const { data } = useAdminGetNotificationHistory({ query: { queryKey: getAdminGetNotificationHistoryQueryKey() } });
  const send = useAdminSendNotification();

  const handleSend = () => {
    if (!title || !message) { toast({ title: "Title and message required", variant: "destructive" }); return; }
    send.mutate({ data: { title, message, type: type as SendNotificationRequestType } }, {
      onSuccess: (r: any) => {
        toast({ title: r?.message || "Notification sent" });
        qc.invalidateQueries({ queryKey: getAdminGetNotificationHistoryQueryKey() });
        setTitle(""); setMessage(""); setType("all");
      },
      onError: () => toast({ title: "Failed to send", variant: "destructive" }),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Send className="h-5 w-5 text-[#48723e]" /> Send Notification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[#a0a0a0]">Target</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-[#111111] border-[#2a2a2a] text-white mt-1" data-testid="select-notif-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="specific">Specific Users</SelectItem>
                    <SelectItem value="market">Market Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#a0a0a0]">Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" className="bg-[#111111] border-[#2a2a2a] text-white mt-1" data-testid="input-notif-title" />
              </div>
              <div>
                <Label className="text-[#a0a0a0]">Message</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Notification message..." className="bg-[#111111] border-[#2a2a2a] text-white mt-1 resize-none" rows={4} data-testid="input-notif-message" />
              </div>
              <Button className="w-full bg-gradient-to-r from-[#1a4718] to-[#48723e]" onClick={handleSend} disabled={send.isPending} data-testid="button-send-notification">
                <Send className="h-4 w-4 mr-2" /> Send Notification
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Bell className="h-5 w-5 text-[#48723e]" /> Notification History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {(data?.notifications || []).length === 0 ? (
                  <div className="text-center py-8 text-[#a0a0a0]">No notifications sent yet</div>
                ) : (data?.notifications || []).map((n: any) => (
                  <div key={n.id} className="p-3 rounded-lg bg-[#111111] border border-[#2a2a2a]" data-testid={`card-notif-${n.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-white font-medium text-sm">{n.title}</div>
                        <div className="text-[#a0a0a0] text-xs mt-1">{n.message}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs bg-[#48723e]/20 text-[#83a561] border border-[#48723e]/30 shrink-0">{n.type}</span>
                    </div>
                    <div className="text-xs text-[#a0a0a0] mt-2">{new Date(n.createdAt).toLocaleString("en-IN")}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
