import { Sidebar } from "@/components/shared/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 1. Sidebar remains static */}
      <Sidebar />

      {/* 2. Main content area scrolls independently */}
      <main className="flex-1 overflow-y-auto p-8 pt-16 md:pt-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
