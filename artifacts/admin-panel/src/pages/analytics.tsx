import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminGetRevenueAnalytics, useAdminGetUserAnalytics, useAdminGetMarketBetAnalytics, getAdminGetRevenueAnalyticsQueryKey, getAdminGetUserAnalyticsQueryKey, getAdminGetMarketBetAnalyticsQueryKey, AdminGetRevenueAnalyticsPeriod } from "@workspace/api-client-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, IndianRupee, Activity } from "lucide-react";

export default function Analytics() {
  const [period, setPeriod] = useState("daily");
  const revenueParams = { period: period as AdminGetRevenueAnalyticsPeriod };
  const { data: revenue } = useAdminGetRevenueAnalytics(revenueParams, { query: { queryKey: getAdminGetRevenueAnalyticsQueryKey(revenueParams) } });
  const { data: userStats } = useAdminGetUserAnalytics({ query: { queryKey: getAdminGetUserAnalyticsQueryKey() } });
  const { data: marketStats } = useAdminGetMarketBetAnalytics({ query: { queryKey: getAdminGetMarketBetAnalyticsQueryKey() } });

  const summaryCards = [
    { title: "Total Deposits", value: revenue?.totals?.totalDeposits || 0, icon: TrendingUp, color: "text-green-400", prefix: "₹" },
    { title: "Total Withdrawals", value: revenue?.totals?.totalWithdrawals || 0, icon: IndianRupee, color: "text-red-400", prefix: "₹" },
    { title: "Net Revenue", value: revenue?.totals?.netRevenue || 0, icon: Activity, color: "text-[#bfdb81]", prefix: "₹" },
    { title: "Total Users", value: userStats?.totalUsers || 0, icon: Users, color: "text-[#48723e]", prefix: "" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 bg-[#111111] border-[#2a2a2a] text-white" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Card key={i} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs text-[#a0a0a0]">{c.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${c.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {c.prefix}{Number(c.value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader><CardTitle className="text-white">Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenue?.data?.slice(-20) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="date" stroke="#a0a0a0" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#a0a0a0" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff" }} />
                  <Legend />
                  <Line type="monotone" dataKey="deposits" stroke="#48723e" dot={false} name="Deposits" />
                  <Line type="monotone" dataKey="withdrawals" stroke="#ef4444" dot={false} name="Withdrawals" />
                  <Line type="monotone" dataKey="profit" stroke="#bfdb81" dot={false} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader><CardTitle className="text-white">User Growth</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={userStats?.data?.slice(-20) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="date" stroke="#a0a0a0" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#a0a0a0" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff" }} />
                  <Bar dataKey="newUsers" fill="#48723e" name="New Users" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a] lg:col-span-2">
            <CardHeader><CardTitle className="text-white">Market Betting Volume</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={marketStats?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="marketName" stroke="#a0a0a0" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#a0a0a0" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff" }} formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, ""]} />
                  <Bar dataKey="totalAmount" fill="#48723e" name="Total Wagered (₹)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
