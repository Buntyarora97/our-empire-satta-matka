import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dices, ArrowDownToLine, ArrowUpFromLine, Activity, TrendingUp, Store, IndianRupee } from "lucide-react";
import { useAdminGetDashboardAnalytics, getAdminGetDashboardAnalyticsQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Dashboard() {
  const { data, isLoading } = useAdminGetDashboardAnalytics({
    query: { queryKey: getAdminGetDashboardAnalyticsQueryKey() }
  });

  const stats = [
    {
      title: "Total Users",
      value: isLoading ? "..." : (data?.totalUsers ?? 0).toLocaleString("en-IN"),
      sub: `+${data?.newUsersToday ?? 0} today`,
      icon: Users,
      color: "text-[#bfdb81]",
    },
    {
      title: "Bets Today",
      value: isLoading ? "..." : `₹${Number(data?.totalWageredToday ?? 0).toLocaleString("en-IN")}`,
      sub: `${data?.totalBetsToday ?? 0} bets placed`,
      icon: Dices,
      color: "text-[#48723e]",
    },
    {
      title: "Pending Deposits",
      value: isLoading ? "..." : String(data?.pendingDeposits ?? 0),
      sub: `₹${Number(data?.totalDepositsToday ?? 0).toLocaleString("en-IN")} today`,
      icon: ArrowDownToLine,
      color: "text-[#f59e0b]",
    },
    {
      title: "Pending Withdrawals",
      value: isLoading ? "..." : String(data?.pendingWithdrawals ?? 0),
      sub: `₹${Number(data?.totalWithdrawalsToday ?? 0).toLocaleString("en-IN")} today`,
      icon: ArrowUpFromLine,
      color: "text-[#ef4444]",
    },
  ];

  const revenueData = (data?.revenueData ?? []).slice(-14).map((r: any) => ({
    date: String(r.date ?? "").slice(5),
    revenue: Number(r.revenue ?? 0),
  }));

  const activityItems = data?.recentActivity ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
          <div className="flex items-center gap-2 text-sm text-[#83a561]">
            <Store className="h-4 w-4" />
            <span>{data?.activeMarkets ?? 0} Active Markets</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#48723e]/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#a0a0a0]">{stat.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-[#a0a0a0] mt-1">{stat.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-[#48723e]" />
                Revenue (Last 14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="date" tick={{ fill: "#a0a0a0", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#a0a0a0", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8 }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#bfdb81" }}
                      formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="#48723e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-[#a0a0a0] text-sm">
                  No revenue data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-[#48723e]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityItems.length === 0 ? (
                <div className="text-center py-8 text-[#a0a0a0] text-sm">
                  No recent activity yet
                </div>
              ) : (
                <div className="space-y-3">
                  {activityItems.slice(0, 5).map((act: any, i: number) => (
                    <div key={act.id ?? i} className="flex flex-col border-l-2 border-[#48723e] pl-4 py-1">
                      <span className="text-sm text-white capitalize">
                        {String(act.action ?? "").replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-[#a0a0a0] mt-0.5">
                        {act.createdAt ? new Date(act.createdAt).toLocaleString("en-IN") : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <IndianRupee className="h-5 w-5 text-[#48723e]" />
              User Growth (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.userGrowth ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={(data?.userGrowth ?? []).slice(-14).map((r: any) => ({ date: String(r.date ?? "").slice(5), count: r.count }))}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="date" tick={{ fill: "#a0a0a0", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#a0a0a0", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#bfdb81" }}
                  />
                  <Bar dataKey="count" name="New Users" fill="#83a561" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-[#a0a0a0] text-sm">
                No growth data yet — register some users first
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
