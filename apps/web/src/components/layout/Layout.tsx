import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  PhoneCall, 
  Users, 
  BarChart2, 
  Activity, 
  Settings, 
  LogOut, 
  FileText, 
  CheckSquare,
  Globe,
  Shield,
  UserCheck
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fetchWithAuth } from "@/lib/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { lang, dir, isArabic, toggleLang, t } = useLanguage();
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    fetchWithAuth("/auth/me")
      .then((data) => {
        if (data) setCurrentUser(data);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { label: t("nav_overview"), href: "/dashboard", icon: BarChart2 },
    { label: t("nav_live_calls"), href: "/live", icon: Activity },
    { label: t("nav_call_history"), href: "/calls", icon: PhoneCall },
    { label: t("nav_reporters"), href: "/customers", icon: Users },
    { label: t("nav_extractions"), href: "/extractions", icon: CheckSquare },
    { label: t("nav_transcripts"), href: "/transcripts", icon: FileText },
    ...(currentUser?.role === "admin"
      ? [{ label: t("nav_users"), href: "/users", icon: UserCheck }]
      : []),
    { label: t("nav_profile"), href: "/profile", icon: Shield },
    { label: t("nav_settings"), href: "/settings", icon: Settings },
  ];

  const getPageTitle = () => {
    switch (router.pathname) {
      case "/":
      case "/dashboard":
        return t("dashboard_overview");
      case "/live":
        return t("header_live_calls");
      case "/calls":
        return t("header_call_history");
      case "/customers":
        return t("header_reporters");
      case "/extractions":
        return t("header_extractions");
      case "/transcripts":
        return t("header_transcripts");
      case "/users":
        return t("header_users");
      case "/profile":
        return t("header_profile");
      case "/settings":
        return t("header_settings");
      default:
        return router.pathname.replace("/", "");
    }
  };

  return (
    <div dir={dir} className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`w-64 bg-slate-900 ${isArabic ? 'border-l' : 'border-r'} border-slate-800 flex flex-col justify-between shrink-0`}>
        <div>
          <div className="h-16 flex items-center px-4 border-b border-slate-800 gap-3">
            <img 
              src="/logo.png" 
              alt="Nagda 122 Logo" 
              className="h-10 w-10 rounded-lg object-contain" 
            />
            <div>
              <h1 className="text-white font-bold text-sm tracking-wide">{t("app_title")}</h1>
              <span className="text-[11px] text-sky-400 font-medium">{t("app_subtitle")}</span>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={toggleLang}
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg w-full transition-colors border border-slate-700/60"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-sky-400" />
              <span>{isArabic ? "اللغة الحالية: العربية" : "Current: English"}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[11px] bg-sky-500/20 text-sky-300 font-bold">
              {t("btn_language_switch")}
            </span>
          </button>

          {currentUser && (
            <Link
              href="/profile"
              className="flex items-center gap-2.5 p-2 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/40 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(currentUser.display_name || currentUser.email || "U").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser.display_name || "User"}
                </div>
                <div className="text-[10px] text-sky-400 uppercase font-mono tracking-wider">
                  {currentUser.role}
                </div>
              </div>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg w-full transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{t("nav_sign_out")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-3">
            {/* Quick Language Toggle Header Pill */}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title={isArabic ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Globe className="h-3.5 w-3.5 text-indigo-600" />
              <span>{isArabic ? "English" : "العربية"}</span>
            </button>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ● {t("status_voice_pipeline_active")}
            </span>
          </div>
        </header>
        <div className="p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
