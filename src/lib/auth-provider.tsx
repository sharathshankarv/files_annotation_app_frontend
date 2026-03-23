"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false); // 🛡️ The local "Emergency Brake"

  useEffect(() => {
    const hydrateSidebar = async () => {
      // 🛡️ Logic Gate: Stop if user exists, no token, or already tried
      if (user || !token || hasFetched.current) return;

      hasFetched.current = true;
      setLoading(true);

      try {
        const { data } = await api.get(API_ENDPOINTS.AUTH.ME);
        setUser(data);
      } catch (err) {
        console.error("Sidebar Auth Hydration Failed", err);
      } finally {
        setLoading(false);
      }
    };

    hydrateSidebar();
  }, [token, user, setUser]);

  return (
    <aside className="w-64 bg-slate-900 h-screen flex flex-col">
      <div className="flex-1">{/* Nav Links */}</div>

      <div className="p-4 border-t border-slate-800">
        {loading ? (
          <div className="animate-pulse h-8 bg-slate-800 rounded" />
        ) : (
          <p className="text-white">{user?.name || "Guest"}</p>
        )}
      </div>
    </aside>
  );
}
