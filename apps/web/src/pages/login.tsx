import React, { useState } from "react";
import { useRouter } from "next/router";
import { getApiBaseUrl } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@callcenter.poc");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        let errorDetail = "Invalid credentials or account disabled";
        try {
          const errData = await res.json();
          if (errData?.detail) {
            errorDetail = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch (_) {}
        throw new Error(errorDetail);
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (eMail: string, pass: string) => {
    setEmail(eMail);
    setPassword(pass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-6">
          <img 
            src="/logo.png" 
            alt="Nagda 122 Logo" 
            className="h-20 w-20 rounded-2xl object-contain mx-auto mb-3 shadow-md" 
          />
          <h1 className="text-2xl font-bold text-slate-800">شرطة النجدة 122 المصرية</h1>
          <p className="text-sm text-slate-500 mt-1">منظومة غرف العمليات وتلقي البلاغات الذكية | NAGDA 122</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email / البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="admin@callcenter.poc"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password / كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In / تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 text-center">
          <p className="font-medium mb-2">Default Accounts (Click to Autofill):</p>
          <div className="flex flex-col gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setPreset("admin@callcenter.poc", "Admin123!")}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-700 flex justify-between items-center transition-colors"
            >
              <span>admin@callcenter.poc</span>
              <span className="text-blue-600 font-sans font-semibold text-[10px]">Admin (Admin123!)</span>
            </button>
            <button
              type="button"
              onClick={() => setPreset("operator@callcenter.poc", "Operator123!")}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-700 flex justify-between items-center transition-colors"
            >
              <span>operator@callcenter.poc</span>
              <span className="text-emerald-600 font-sans font-semibold text-[10px]">Operator (Operator123!)</span>
            </button>
            <button
              type="button"
              onClick={() => setPreset("admin@callcenter.local", "Admin123456!")}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-700 flex justify-between items-center transition-colors"
            >
              <span>admin@callcenter.local</span>
              <span className="text-purple-600 font-sans font-semibold text-[10px]">Admin (Admin123456!)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
