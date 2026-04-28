"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { FileText, Activity } from "lucide-react";
import { useMe } from "@/features/auth/hooks/useMe";
import { api } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { useNavigator } from "@/hooks/use-navigator";
import { runFullDocScan } from "@/features/documents/services/full-doc-scan";
import { toast } from "sonner";

type UserDocument = {
  id: string;
  name: string;
  mimeType: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const { data: user } = useMe();
  const navigate = useNavigator();
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [scanningDocId, setScanningDocId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoadingDocs(true);
      try {
        const { data } = await api.get<UserDocument[]>(API_ENDPOINTS.DOCUMENTS.LIST);
        if (mounted) {
          setDocs(data ?? []);
        }
      } finally {
        if (mounted) setLoadingDocs(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFullDocScan = async (doc: UserDocument) => {
    setScanningDocId(doc.id);
    try {
      const result = await runFullDocScan(doc.id);
      if (result.totalRefs === 0) {
        toast.info("No references were returned by external API.");
      } else if (result.matchedRefs === 0) {
        toast.info("References returned, but no text matched in document.");
      } else {
        toast.success(
          `Full scan completed. ${result.matchedRefs}/${result.totalRefs} references highlighted.`,
        );
      }
      navigate.goToDocument(doc.id);
    } catch {
      toast.error("Full document scan failed. Please try again.");
    } finally {
      setScanningDocId(null);
    }
  };

  const stats = [
    {
      label: "Uploaded Documents",
      value: String(docs.length),
      icon: FileText,
      color: "text-blue-500",
    },
    {
      label: "Scan Ready",
      value: String(docs.filter((d) => d.mimeType === "application/pdf").length),
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
      <div className="grid gap-4 md:grid-cols-2">
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

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Full Doc Scan</h2>
        <div className="mb-4">
          <button
            onClick={() => navigate.native.push("/documents/upload?mode=full-scan")}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            Upload For Full Scan
          </button>
        </div>
        {loadingDocs ? (
          <p className="text-sm text-slate-500">Loading documents...</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => {
              const isPdf = doc.mimeType === "application/pdf";
              const running = scanningDocId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                    <p className="text-xs text-slate-500">
                      Updated {new Date(doc.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate.goToDocument(doc.id)}
                      className="rounded border px-3 py-1 text-sm text-slate-700"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleFullDocScan(doc)}
                      disabled={!isPdf || running || Boolean(scanningDocId)}
                      className="rounded bg-amber-600 px-3 py-1 text-sm text-white disabled:bg-amber-300 disabled:cursor-not-allowed"
                      title={isPdf ? "Run background full scan" : "Only PDF supported"}
                    >
                      {running ? "Scanning..." : "Find References"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
