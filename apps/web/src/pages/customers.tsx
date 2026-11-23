import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { fetchWithAuth } from "@/lib/api";
import { UserPlus, Search, PhoneForwarded } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [lang, setLang] = useState("ar-EG");

  const loadCustomers = async () => {
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetchWithAuth(`/customers?page=1&page_size=50${q}`);
      setCustomers(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth("/customers", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phone,
          preferred_language: lang,
          consent_status: "granted",
        }),
      });
      setShowModal(false);
      setFullName("");
      setPhone("");
      loadCustomers();
    } catch (err: any) {
      alert(err.message || "Failed to create customer");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Reporters Directory | سجل المبلّغين</h3>
            <p className="text-sm text-slate-500">Manage incident reporters, emergency contacts, and dispatch records</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" /> Add Reporter
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reporters by name or telephone..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Reporter Name</th>
                <th className="px-6 py-3">Phone Number</th>
                <th className="px-6 py-3">Language</th>
                <th className="px-6 py-3">Consent Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Quick Call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{c.full_name}</td>
                  <td className="px-6 py-4 font-mono text-xs">{c.phone_number}</td>
                  <td className="px-6 py-4 text-xs uppercase font-medium">{c.preferred_language}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.consent_status === "granted"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {c.consent_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={async () => {
                        if (confirm(`Initiate outbound AI call to ${c.full_name} (${c.phone_number})?`)) {
                          try {
                            await fetchWithAuth("/calls/outbound", {
                              method: "POST",
                              body: JSON.stringify({
                                customer_id: c.id,
                                language: c.preferred_language,
                                call_mode: "simulated",
                              }),
                            });
                            alert("Outbound call initiated successfully!");
                          } catch (err: any) {
                            alert(err.message || "Failed to trigger call");
                          }
                        }
                      }}
                      className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg inline-flex"
                      title="Direct Outbound Call"
                    >
                      <PhoneForwarded className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Add Reporter | إضافة مبلّغ جديد</h4>
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Ahmed Hassan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Phone Number (E.164)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+201234567890"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Preferred Language
                  </label>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="ar-EG">Egyptian Arabic (ar-EG)</option>
                    <option value="en">English (en)</option>
                  </select>
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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    Save Reporter
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
