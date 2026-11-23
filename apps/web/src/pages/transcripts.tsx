import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { fetchWithAuth, formatCallDateTime } from "@/lib/api";
import { 
  FileText, 
  Search, 
  Copy, 
  Check, 
  Phone, 
  User, 
  Bot, 
  Clock, 
  Calendar, 
  MessageSquare,
  Sparkles
} from "lucide-react";

export default function TranscriptsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [transcriptData, setTranscriptData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const res = await fetchWithAuth("/calls?page=1&page_size=50");
      if (res && res.items) {
        setCalls(res.items);
        if (res.items.length > 0) {
          selectCall(res.items[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load calls:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectCall = async (call: any) => {
    setSelectedCall(call);
    setLoadingTranscript(true);
    setTranscriptData(null);
    try {
      const res = await fetchWithAuth(`/calls/${call.id}/transcript`);
      setTranscriptData(res);
    } catch (err) {
      console.warn("No transcript record found:", err);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const filteredCalls = calls.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      (c.from_number && c.from_number.includes(q)) ||
      (c.to_number && c.to_number.includes(q)) ||
      (c.ai_summary && c.ai_summary.toLowerCase().includes(q))
    );
  });

  const handleCopy = () => {
    const textToCopy = transcriptData?.transcript_text || selectedCall?.ai_summary || "";
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Parse lines into dialogue items
  const parseTranscriptLines = (rawText: string) => {
    if (!rawText) return [];
    return rawText.split("\n").filter((l) => l.trim().length > 0).map((line, idx) => {
      const isCaller = line.startsWith("Caller:") || line.startsWith("Customer:") || line.startsWith("Customer/Operator:");
      const isAssistant = line.startsWith("AI Assistant:") || line.startsWith("Assistant:") || line.startsWith("AI:");
      
      let speaker = "Participant";
      let text = line;

      if (isCaller) {
        speaker = "Caller";
        text = line.substring(line.indexOf(":") + 1).trim();
      } else if (isAssistant) {
        speaker = "AI Assistant";
        text = line.substring(line.indexOf(":") + 1).trim();
      }

      return { id: idx, speaker, text, isAssistant };
    });
  };

  const dialogue = parseTranscriptLines(transcriptData?.transcript_text || "");

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Call Transcripts & Dialogue</h3>
          <p className="text-sm text-slate-500">
            Inspect verified conversation logs, turn-by-turn dialogue, and AI executive summaries
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-210px)] min-h-[600px]">
          {/* Left Panel: Call List */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by phone, ID, or summary..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading call history...</div>
              ) : filteredCalls.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No transcripts found</div>
              ) : (
                filteredCalls.map((c) => {
                  const isSelected = selectedCall?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => selectCall(c)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50/70 border-l-4 border-blue-600"
                          : "hover:bg-slate-50 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {c.id.slice(0, 8)}...
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            c.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-slate-600 mb-1">
                        {c.from_number} → {c.to_number}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Calendar className="h-3 w-3 text-blue-500" /> {formatCallDateTime(c.started_at || c.created_at).full}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {c.duration_seconds || 0}s
                        </span>
                        <span className="uppercase font-medium text-slate-400">{c.language}</span>
                      </div>

                      <div className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100 font-sans">
                        {c.ai_summary || "Call logged."}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Transcript Details */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
            {selectedCall ? (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">
                        Transcript Details
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        #{selectedCall.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                        {selectedCall.language === "ar-EG" ? "Egyptian Arabic (ar-EG)" : selectedCall.language}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded">
                        <Calendar className="h-3 w-3 text-blue-600" />
                        {formatCallDateTime(selectedCall.started_at || selectedCall.created_at).full}
                      </span>
                      <span>•</span>
                      <span>{selectedCall.from_number} → {selectedCall.to_number}</span>
                      <span>•</span>
                      <span>{selectedCall.duration_seconds || 0}s duration</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Transcript</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Executive Summary Box */}
                {selectedCall.ai_summary && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/70">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" /> AI Executive Summary
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">
                      {selectedCall.ai_summary}
                    </p>
                  </div>
                )}

                {/* Turn-by-Turn Dialogue Stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingTranscript ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      Loading conversation turns...
                    </div>
                  ) : dialogue.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <MessageSquare className="h-10 w-10 mx-auto text-slate-300 mb-2 opacity-50" />
                      <p className="text-sm font-medium">No recorded conversation dialogue</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Call was answered and status logged without voice turns.
                      </p>
                    </div>
                  ) : (
                    dialogue.map((item) => (
                      <div
                        key={item.id}
                        className={`flex gap-3 max-w-xl ${
                          item.isAssistant ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                            item.isAssistant ? "bg-blue-600" : "bg-purple-600"
                          }`}
                        >
                          {item.isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>

                        <div
                          className={`rounded-2xl p-3.5 shadow-sm text-sm ${
                            item.isAssistant
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                          }`}
                        >
                          <div
                            className={`text-[10px] font-bold uppercase mb-1 ${
                              item.isAssistant ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            {item.speaker}
                          </div>
                          <div className="leading-relaxed font-sans">{item.text}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Select a call from the left to inspect its transcript
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
