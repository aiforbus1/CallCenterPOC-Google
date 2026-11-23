import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { fetchWithAuth } from "@/lib/api";
import { 
  Activity, 
  PhoneCall, 
  Radio, 
  PhoneIncoming, 
  PhoneOutgoing, 
  CheckCircle, 
  Clock, 
  Mic, 
  Volume2, 
  RefreshCw,
  PhoneOff
} from "lucide-react";

export default function LiveCallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchLiveCalls = async () => {
    try {
      const res = await fetchWithAuth("/calls?page=1&page_size=30");
      if (res && res.items) {
        setCalls(res.items);
      }
    } catch (err) {
      console.error("Failed to load calls:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCalls();
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchLiveCalls();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleSimulateIncoming = async () => {
    setSimulating(true);
    try {
      await fetchWithAuth("/calls/mobile/simulate-incoming", {
        method: "POST",
        body: JSON.stringify({
          customer_name: "عميل تجريبي - محمد علي",
          phone_number: "+201012345678",
          language: "ar-EG",
          notes: "مكالمة تجريبية لاختبار المساعد الذكي",
        }),
      });
      await fetchLiveCalls();
    } catch (err: any) {
      alert(err.message || "Failed to simulate incoming call");
    } finally {
      setSimulating(false);
    }
  };

  const handleEndCall = async (callId: string) => {
    try {
      await fetchWithAuth(`/calls/${callId}/end`, { method: "POST" });
      await fetchLiveCalls();
    } catch (err: any) {
      alert(err.message || "Failed to end call");
    }
  };

  const handleCleanupStale = async () => {
    try {
      await fetchWithAuth("/calls/cleanup-stale?max_age_minutes=1", { method: "POST" });
      await fetchLiveCalls();
    } catch (err: any) {
      alert(err.message || "Failed to cleanup stale calls");
    }
  };

  const activeCalls = calls.filter((c) => c.status === "in_progress" || c.status === "ringing");
  const recentCalls = calls.filter((c) => c.status === "completed" || c.status === "failed").slice(0, 8);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-xl font-bold text-slate-800">Live Call Monitor</h3>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Real-time monitoring of active voice streams, bidirectional AI dialogue, and telemetry
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                autoRefresh
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-300"
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto-refreshing (5s)" : "Paused"}
            </button>

            <button
              onClick={handleSimulateIncoming}
              disabled={simulating}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <PhoneIncoming className="h-4 w-4" />
              {simulating ? "Ringing..." : "Simulate Inbound Call"}
            </button>
          </div>
        </div>

        {/* Live Active Streams Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-blue-600 animate-pulse" />
              <h4 className="font-bold text-slate-800 text-base">
                Active Calls ({activeCalls.length})
              </h4>
              {activeCalls.length > 0 && (
                <button
                  onClick={handleCleanupStale}
                  className="text-xs text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-md px-2 py-0.5 ml-2 transition-colors"
                  title="Force complete any calls that were abandoned or interrupted"
                >
                  Clear Stale Calls
                </button>
              )}
            </div>
            <span className="text-xs font-medium text-slate-400">
              Orchestrator: Gemini 2.0 Flash + Whisper + Nova TTS
            </span>
          </div>

          {activeCalls.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <PhoneCall className="h-10 w-10 mx-auto text-slate-300 mb-2 opacity-50" />
              <p className="text-sm font-medium">No live calls in progress right now</p>
              <p className="text-xs text-slate-400 mt-1">
                Make a call from the mobile app or click &ldquo;Simulate Inbound Call&rdquo; above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCalls.map((c) => (
                <div
                  key={c.id}
                  className="border border-blue-200 bg-blue-50/40 rounded-xl p-5 relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      {c.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {c.direction === "inbound" ? (
                        <PhoneIncoming className="h-5 w-5" />
                      ) : (
                        <PhoneOutgoing className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {c.direction === "inbound" ? "Inbound Caller" : "Outbound Agent"}
                      </div>
                      <div className="text-xs font-mono text-slate-600">{c.from_number} → {c.to_number}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white rounded-lg p-2.5 border border-blue-100 text-xs mb-3">
                    <div>
                      <div className="text-slate-400 font-semibold uppercase text-[10px]">Dialect</div>
                      <div className="font-bold text-slate-800">
                        {c.language === "ar-EG" ? "مصرى (ar-EG)" : c.language}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-semibold uppercase text-[10px]">Mode</div>
                      <div className="font-bold text-slate-800 capitalize">{c.call_mode}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-semibold uppercase text-[10px]">Duration</div>
                      <div className="font-bold font-mono text-blue-600">
                        {c.duration_seconds || 0}s
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-blue-100/80">
                    <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                      <Mic className="h-3.5 w-3.5" /> STT Listening
                      <span className="text-slate-300">|</span>
                      <Volume2 className="h-3.5 w-3.5" /> TTS Streaming
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">
                        ID: {c.id.slice(0, 8)}...
                      </span>
                      <button
                        onClick={() => handleEndCall(c.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-colors"
                      >
                        <PhoneOff className="h-3 w-3" />
                        <span>End Call</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Concluded Calls */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
            <h4 className="font-bold text-slate-800 text-sm">Recent Completed Calls</h4>
            <span className="text-xs text-slate-400">Auto-saved to PostgreSQL</span>
          </div>

          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Call ID</th>
                <th className="px-6 py-3">Numbers</th>
                <th className="px-6 py-3">Language</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">AI Executive Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCalls.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs font-semibold text-slate-800">
                    {c.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-3 text-xs font-mono">
                    {c.from_number} → {c.to_number}
                  </td>
                  <td className="px-6 py-3 text-xs font-medium uppercase">
                    {c.language}
                  </td>
                  <td className="px-6 py-3 text-xs font-mono">{c.duration_seconds || 0}s</td>
                  <td className="px-6 py-3 text-xs text-slate-700 max-w-md truncate">
                    {c.ai_summary || "Call completed and logged."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
