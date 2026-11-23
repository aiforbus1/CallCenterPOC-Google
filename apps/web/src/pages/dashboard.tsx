import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { fetchWithAuth, formatCallDateTime } from "@/lib/api";
import { PhoneIncoming, PhoneOutgoing, CheckCircle, Clock, AlertTriangle, ArrowUpRight, Calendar } from "lucide-react";
import Link from "next/link";

export default function Overview() {
  const [metrics, setMetrics] = useState({
    total: 0,
    inbound: 0,
    outbound: 0,
    completed: 0,
    failed: 0,
    avgDuration: 0,
  });
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const callsRes = await fetchWithAuth("/calls?page=1&page_size=10");
        const calls = callsRes.items || [];
        setRecentCalls(calls);

        let inb = 0, outb = 0, comp = 0, fail = 0, totSec = 0;
        calls.forEach((c: any) => {
          if (c.direction === "inbound") inb++;
          if (c.direction === "outbound") outb++;
          if (c.status === "completed") comp++;
          if (c.status === "failed") fail++;
          if (c.duration_seconds) totSec += c.duration_seconds;
        });

        setMetrics({
          total: callsRes.total || 0,
          inbound: inb,
          outbound: outb,
          completed: comp,
          failed: fail,
          avgDuration: calls.length > 0 ? Math.round(totSec / calls.length) : 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const cards = [
    { label: "Total Calls", value: metrics.total, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Inbound vs Outbound", value: `${metrics.inbound} / ${metrics.outbound}`, icon: PhoneIncoming, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Completed", value: metrics.completed, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Failed / Missed", value: metrics.failed, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">{c.label}</span>
                  <div className={`p-2 rounded-lg ${c.bg} ${c.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-800 mt-2">{loading ? "..." : c.value}</div>
              </div>
            );
          })}
        </div>

        {/* Live Call Pipeline Info */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-blue-300">
                AI Speech Architecture Status
              </span>
              <h3 className="text-xl font-bold mt-1">Whisper Large V3 Turbo + Gemini Flash-Lite TTS</h3>
              <p className="text-sm text-blue-200 mt-1">
                Full bidirectional media streaming with OpenRouter endpoints configured.
              </p>
            </div>
            <Link
              href="/calls"
              className="bg-white text-blue-900 hover:bg-blue-50 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              Originate Outbound Call <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Recent Calls Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Recent Call Records</h3>
            <Link href="/calls" className="text-xs font-semibold text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">ID / Time</th>
                  <th className="px-6 py-3">Direction</th>
                  <th className="px-6 py-3">From / To</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">AI Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCalls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      {loading ? "Loading calls..." : "No calls recorded yet."}
                    </td>
                  </tr>
                ) : (
                  recentCalls.map((call: any) => (
                    <tr key={call.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-700">
                        <div className="font-semibold text-slate-800">{call.id.slice(0, 8)}...</div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span>{formatCallDateTime(call.started_at || call.created_at).full}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            call.direction === "inbound"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {call.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        <div>From: {call.from_number}</div>
                        <div>To: {call.to_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            call.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">{call.duration_seconds ? `${call.duration_seconds}s` : "—"}</td>
                      <td className="px-6 py-4 text-xs max-w-xs truncate text-slate-700">
                        {call.ai_summary || (
                          call.status === "completed" ? (
                            <span className="text-slate-400 italic">Completed (Summary logged)</span>
                          ) : (
                            <span className="text-blue-500 italic">Call in progress...</span>
                          )
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
