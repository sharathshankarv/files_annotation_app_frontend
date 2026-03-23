"use client";

import {
  Upload,
  LayoutDashboard,
  Files,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { useNavigator } from "@/hooks/use-navigator";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { cn } from "@/lib/utils";
import { useUserHydration } from "@/hooks/use-user-hydration";

export function Sidebar() {
  const navigate = useNavigator();
  const { user, isLoading } = useUserHydration();
  const { handleLogout } = useLogout();

  return (
    <aside className="w-64 h-screen border-r bg-white flex flex-col shadow-sm">
      {/* 1. Top Section: Branding */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Enterprise <span className="text-blue-600">OS</span>
        </h1>
      </div>

      {/* 2. Middle Section: Nav & Actions */}
      <div className="flex-1 p-4 space-y-8 overflow-y-auto">
        {/* Primary Action Group */}
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Actions
          </p>
          <button
            onClick={() => navigate.goToUpload()}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Navigation Group */}
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Menu
          </p>
          <nav className="space-y-1">
            <SidebarNavItem
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              onClick={() => navigate.goToDashboard()}
            />
            <SidebarNavItem
              icon={<Files size={20} />}
              label="My Documents"
              onClick={() => navigate.goToDashboard()}
            />
            <SidebarNavItem
              icon={<Settings size={20} />}
              label="Settings"
              onClick={() => {}}
            />
          </nav>
        </div>
      </div>

      {/* 3. Bottom Section: User & Logout */}
      <div className="p-4 border-t bg-slate-50/50">
        <div className="flex items-center gap-3 p-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
            JD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-slate-900 truncate">
              Welcome, {user?.name}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              Principal Engineer
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all text-sm font-medium group"
    >
      <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
