import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { fetchWithAuth, formatCallDateTime } from "@/lib/api";
import { Check, Edit2, AlertCircle, Building2, Tag, PhoneForwarded, PhoneCall, Calendar, Clock } from "lucide-react";

export default function ExtractionsPage() {
  const [calls, setCalls] = useState([]);
  const [selectedCallId, setSelectedCallId] = useState("");
  const [extraction, setExtraction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    summary: "",
    intent: "",
    priority: "normal",
    requested_action: "",
    category: "",
    assigned_department: "",
    department_phone: "",
  });

  useEffect(() => {
    async function loadCalls() {
      try {
        const res = await fetchWithAuth("/calls?page=1&page_size=50");
        const items = res.items || [];
        setCalls(items);
        if (items.length > 0) {
          loadExtraction(items[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCalls();
  }, []);

  const loadExtraction = async (callId: string) => {
    setSelectedCallId(callId);
    setLoading(true);
    setEditing(false);
    try {
      const res = await fetchWithAuth(`/calls/${callId}/extraction`);
      setExtraction(res);
      setFormData({
        summary: res.summary || "",
        intent: res.intent || "",
        priority: res.priority || "normal",
        requested_action: res.requested_action || "",
        category: res.category || "",
        assigned_department: res.assigned_department || "",
        department_phone: res.department_phone || "",
      });
    } catch (err) {
      setExtraction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCorrection = async () => {
    try {
      const updated = await fetchWithAuth(`/calls/${selectedCallId}/extraction`, {
        method: "PATCH",
        body: JSON.stringify(formData),
      });
      setExtraction(updated);
      setEditing(false);
      alert("Extraction updated & audit log saved!");
    } catch (err: any) {
      alert(err.message || "Failed to update extraction");
    }
  };

  const handleMarkReviewed = async () => {
    try {
      await fetchWithAuth(`/calls/${selectedCallId}/review`, {
        method: "POST",
        body: JSON.stringify({ notes: "Reviewed by operator via web dashboard" }),
      });
      loadExtraction(selectedCallId);
      alert("Call marked as reviewed!");
    } catch (err: any) {
      alert(err.message || "Review action failed");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Post-Call Extraction & Routing Review</h3>
          <p className="text-sm text-slate-500">
            Review structured data, categorized issues, assigned departments, and automated outbound dispatch calls
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Call Selector List */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-[650px] overflow-y-auto space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2">Calls For Review</h4>
            {calls.map((c: any) => (
              <button
                key={c.id}
                onClick={() => loadExtraction(c.id)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                  selectedCallId === c.id
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-xs font-semibold text-slate-700">{c.id.slice(0, 8)}...</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                    {c.direction}
                  </span>
                </div>
                <div className="text-xs text-slate-500">{c.from_number} → {c.to_number}</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-mono">
                  <Calendar className="h-3 w-3 text-blue-500" />
                  <span>{formatCallDateTime(c.started_at || c.created_at).full}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Details / Review Panel */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            {loading ? (
              <div className="py-20 text-center text-slate-400">Loading extraction data...</div>
            ) : !extraction ? (
              <div className="py-20 text-center text-slate-400">
                <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                No extraction generated yet for this call record.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-semibold text-slate-400">Review Status</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          extraction.review_status === "reviewed"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {extraction.review_status}
                      </span>
                      <span className="text-xs text-slate-400">
                        Priority: <strong className="uppercase text-slate-700">{extraction.priority}</strong>
                      </span>
                    </div>
                    {/* Call Date & Time Display */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono mt-1">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-semibold text-slate-700">Call Date & Time:</span>
                      <span>
                        {(() => {
                          const currCall: any = calls.find((c: any) => c.id === selectedCallId);
                          return currCall ? formatCallDateTime(currCall.started_at || currCall.created_at).full : "—";
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center gap-1.5"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit Data
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveCorrection}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                      >
                        Save Changes
                      </button>
                    )}
                    {extraction.review_status !== "reviewed" && (
                      <button
                        onClick={handleMarkReviewed}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" /> Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>

                {/* Routing & Department Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {/* Category */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-purple-700 font-semibold mb-1">
                      <Tag className="h-3.5 w-3.5" />
                      <span>Issue Category</span>
                    </div>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-2 py-1 border text-xs rounded bg-white"
                      />
                    ) : (
                      <div className="text-xs font-bold text-slate-800">
                        {extraction.category || "Uncategorized"}
                      </div>
                    )}
                  </div>

                  {/* Assigned Department */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold mb-1">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Assigned Department</span>
                    </div>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.assigned_department}
                        onChange={(e) => setFormData({ ...formData, assigned_department: e.target.value })}
                        className="w-full px-2 py-1 border text-xs rounded bg-white"
                      />
                    ) : (
                      <div className="text-xs font-bold text-slate-800">
                        {extraction.assigned_department || "Not Assigned"}
                        {extraction.department_phone && (
                          <span className="block text-[11px] font-mono text-slate-500 font-normal mt-0.5">
                            {extraction.department_phone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Outbound Call Trigger Status */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
                      <PhoneForwarded className="h-3.5 w-3.5" />
                      <span>Dept Outbound Call</span>
                    </div>
                    <div className="text-xs">
                      {extraction.outbound_call_triggered ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="h-3 w-3" /> Call Dispatched
                        </span>
                      ) : (
                        <span className="text-slate-400">None Triggered</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form / View */}
                <div className="space-y-4">
                  {/* Reporter Information */}
                  {(extraction.customer_name || extraction.callback_number) && (
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-blue-900 uppercase">Reporter Contact Info:</span>
                      <div className="flex gap-4 text-blue-800">
                        <span>Name: <strong>{extraction.customer_name || "—"}</strong></span>
                        <span>Callback Phone: <strong>{extraction.callback_number || "—"}</strong></span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Intent</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.intent}
                        onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {extraction.intent || "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">AI Summary</label>
                    {editing ? (
                      <textarea
                        rows={3}
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                        {extraction.summary || "No summary available"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Requested Action / Follow-Up
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.requested_action}
                        onChange={(e) => setFormData({ ...formData, requested_action: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {extraction.requested_action || "None required"}
                      </p>
                    )}
                  </div>

                  {/* Raw Extracted JSON Preview */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Question Extraction & Matching Key-Values
                    </label>
                    <pre className="bg-slate-900 text-slate-200 text-xs p-4 rounded-xl overflow-x-auto font-mono">
                      {JSON.stringify(extraction.extracted_json || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
