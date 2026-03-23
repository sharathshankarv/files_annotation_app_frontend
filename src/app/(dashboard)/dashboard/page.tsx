"use client";

import { useMe } from "@/features/auth/hooks/useMe";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card"; // We'll define this next
import { Briefcase, Users, FileText, Activity } from "lucide-react";

export default function DashboardPage() {
  const { data: user } = useMe();

  const stats = [
    {
      label: "Total Projects",
      value: "12",
      icon: Briefcase,
      color: "text-blue-500",
    },
    {
      label: "Active Users",
      value: "1,204",
      icon: Users,
      color: "text-green-500",
    },
    {
      label: "Documents",
      value: "48",
      icon: FileText,
      color: "text-purple-500",
    },
    {
      label: "System Health",
      value: "99.9%",
      icon: Activity,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Here is what is happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
              <stat.icon className={cn("h-8 w-8 opacity-75", stat.color)} />
            </div>
          </Card>
        ))}
      </div>

      {/* Feature Section Placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="h-[400px] flex items-center justify-center border-dashed">
          <p className="text-muted-foreground">Activity Chart Coming Soon</p>
        </Card>
        <Card className="h-[400px] flex items-center justify-center border-dashed">
          <p className="text-muted-foreground">Recent Documents Coming Soon</p>
        </Card>
      </div>
    </div>
  );
}
