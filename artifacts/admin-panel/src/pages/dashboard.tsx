import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dices, ArrowDownToLine, ArrowUpFromLine, Activity } from "lucide-react";

export default function Dashboard() {
  // Mock Data since API hook useAdminGetDashboardAnalytics might not be fully functional in sandbox without setup
  const stats = [
    { title: "Total Users", value: "2,845", icon: Users, color: "text-[#bfdb81]" },
    { title: "Bets Today", value: "₹45,230", icon: Dices, color: "text-[#48723e]" },
    { title: "Pending Deposits", value: "14", icon: ArrowDownToLine, color: "text-[#f59e0b]" },
    { title: "Pending Withdrawals", value: "8", icon: ArrowUpFromLine, color: "text-[#ef4444]" }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#a0a0a0]">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-[#48723e]" />
                Active Markets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Kalyan", "Milan Day", "Rajdhani Night", "Time Bazar"].map((market, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#111111] border border-[#2a2a2a]">
                    <div>
                      <h4 className="font-semibold text-white">{market}</h4>
                      <p className="text-xs text-[#a0a0a0]">Closes at 4:00 PM</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium border border-[#22c55e]/20">
                      LIVE
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a] col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { msg: "User rahul_99 requested withdrawal of ₹5,000", time: "2 mins ago" },
                  { msg: "Result declared for Kalyan: 145-0-280", time: "15 mins ago" },
                  { msg: "Deposit ₹10,000 from vikram_s approved", time: "1 hour ago" },
                ].map((act, i) => (
                  <div key={i} className="flex flex-col border-l-2 border-[#48723e] pl-4 py-1">
                    <span className="text-sm text-white">{act.msg}</span>
                    <span className="text-xs text-[#a0a0a0] mt-1">{act.time}</span>
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
