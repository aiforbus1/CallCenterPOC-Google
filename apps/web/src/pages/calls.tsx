import React, { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { fetchWithAuth, formatCallDateTime } from "@/lib/api";
import { 
  PhoneCall, 
  Eye, 
  Calendar, 
  Clock, 
  X, 
  FileText, 
  ArrowUpRight, 
  Sparkles, 
  Phone, 
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Radio
} from "lucide-react";

export default function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [toNumber, setToNumber] = useState("");
  const [language, setLanguage] = useState("en");
  const [callMode, setCallMode] = useState("simulated");
  const [calling, setCalling] = useState(false);

  const loadCalls = async () => {
    try {
      const res = await fetchWithAuth("/calls?page=1&page_size=50");
      setCalls(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, []);

  const handleOriginateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalling(true);
    try {
      await fetchWithAuth("/calls/outbound", {
        method: "POST",
        body: JSON.stringify({
          to_number: toNumber,
          language,
          call_mode: callMode,
        }),
      });
      setShowModal(false);
      setToNumber("");
      loadCalls();
    } catch (err: any) {
      alert(err.message || "Failed to originate call");
    } finally {
      setCalling(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Call Operations & History</h3>
            <p className="text-sm text-slate-500">Monitor live incoming emergency calls and dispatch operations</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <PhoneCall className="h-4 w-4" /> Originate Outbound Call
          </button>
        </div>

        {/* Calls Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Call ID / Provider</th>
                <th className="px-6 py-3">Direction & Mode</th>
                <th className="px-6 py-3">From / To</th>
                <th className="px-6 py-3">Date & Time</th>
                <th className="px-6 py-3">Language</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Loading call operations...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No calls recorded yet.
                  </td>
                </tr>
              ) : (
                calls.map((c: any) => {
                  const callDt = formatCallDateTime(c.started_at || c.created_at);
                  return (
                    <tr 
                      key={c.id} 
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedCall(c)}
                    >
                      <td className="px-6 py-4 font-mono text-xs">
                        <div className="font-semibold text-slate-800">{c.id.slice(0, 8)}...</div>
                        <div className="text-[10px] text-slate-400">{c.provider_call_id || "simulated"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize font-medium text-slate-700">{c.direction}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {c.call_mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        <div className="font-medium text-slate-700">{c.from_number}</div>
                        <div className="text-slate-400 text-[11px]">→ {c.to_number}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Calendar className="h-3.5 w-3.5 text-blue-600" />
                          <span>{callDt.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{callDt.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs uppercase font-medium">
                        {c.language === "ar-EG" ? "ar-EG (العامية)" : c.language}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : c.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">{c.duration_seconds ? `${c.duration_seconds}s` : "—"}</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedCall(c)}
                          className="px-2.5 py-1.5 hover:bg-blue-50 text-blue-600 rounded-lg inline-flex items-center gap-1 text-xs font-medium border border-blue-200"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Call Details Modal */}
        {selectedCall && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">
                      Emergency Call Details & Dispatch Log
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Call ID: {selectedCall.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCall(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* 1. Date & Time Highlight Card */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wide mb-3">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>تاريخ ووقت المكالمة (Call Date & Time)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-blue-100/60 shadow-xs">
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-blue-500" /> Date (التاريخ)
                      </div>
                      <div className="text-sm font-bold text-slate-800 mt-1 font-mono">
                        {formatCallDateTime(selectedCall.started_at || selectedCall.created_at).date}
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-blue-100/60 shadow-xs">
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3 text-blue-500" /> Started At (البدء)
                      </div>
                      <div className="text-sm font-bold text-slate-800 mt-1 font-mono">
                        {formatCallDateTime(selectedCall.started_at || selectedCall.created_at).time}
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-blue-100/60 shadow-xs">
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-emerald-500" /> Ended At (الانتهاء)
                      </div>
                      <div className="text-sm font-bold text-slate-800 mt-1 font-mono">
                        {formatCallDateTime(selectedCall.ended_at).time}
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-blue-100/60 shadow-xs">
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3 text-indigo-500" /> Duration (المدة)
                      </div>
                      <div className="text-sm font-bold text-indigo-700 mt-1 font-mono">
                        {selectedCall.duration_seconds ? `${selectedCall.duration_seconds} sec` : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Call Telephony & Participants Information */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium block mb-1">Direction & Mode</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selectedCall.direction} ({selectedCall.call_mode})
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium block mb-1">Status</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        selectedCall.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedCall.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium block mb-1">Language</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCall.language === "ar-EG" ? "Egyptian Arabic (ar-EG)" : selectedCall.language}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                    <span className="text-slate-400 font-medium block mb-1">Caller Number (From)</span>
                    <span className="font-bold text-slate-800">{selectedCall.from_number}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                    <span className="text-slate-400 font-medium block mb-1">Operations Line (To)</span>
                    <span className="font-bold text-slate-800">{selectedCall.to_number}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                    <span className="text-slate-400 font-medium block mb-1">Provider Call ID</span>
                    <span className="text-slate-600 truncate block">
                      {selectedCall.provider_call_id || "simulated-session"}
                    </span>
                  </div>
                </div>

                {/* 3. AI Executive Summary & Police Incident Report */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span>AI Executive Incident Summary (ملخص البلاغ الذكي)</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedCall.ai_summary || "No AI summary logged for this call."}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/transcripts?callId=${selectedCall.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    <span>View Transcript (التفريغ)</span>
                  </Link>

                  <Link
                    href={`/extractions?callId=${selectedCall.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Routing & Extractions (التوجيه)</span>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCall(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Originate Call Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Originate Outbound Call</h4>
              <form onSubmit={handleOriginateCall} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Destination Phone Number
                  </label>
                  <input
                    type="text"
                    value={toNumber}
                    onChange={(e) => setToNumber(e.target.value)}
                    required
                    placeholder="+201234567890"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">E.164 international format</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="en">English</option>
                      <option value="ar-EG">Egyptian Arabic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Mode</label>
                    <select
                      value={callMode}
                      onChange={(e) => setCallMode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="simulated">Simulated (In-App)</option>
                      <option value="real">Real (Twilio)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={calling}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    {calling ? "Originating..." : "Start Call"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
