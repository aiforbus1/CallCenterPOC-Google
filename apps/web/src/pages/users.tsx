import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/context/LanguageContext";
import { fetchWithAuth } from "@/lib/api";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Users,
  UserPlus,
  KeyRound,
  Edit2,
  Trash2,
  Lock,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  RefreshCw,
  Check,
  Eye,
  EyeOff,
  UserX,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "operator" | "viewer" | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { isArabic, dir } = useLanguage();

  // Auth & Permissions State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Users Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // New User Form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<string>("operator");
  const [newIsActive, setNewIsActive] = useState(true);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingNewUser, setSavingNewUser] = useState(false);

  // Edit User Form
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<string>("operator");
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEditUser, setSavingEditUser] = useState(false);

  // Reset Password Form
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [showResetPass, setShowResetPass] = useState(false);
  const [savingResetPass, setSavingResetPass] = useState(false);

  // Load Current User & Check Role
  useEffect(() => {
    async function checkAuth() {
      try {
        setLoadingAuth(true);
        const me = await fetchWithAuth("/auth/me");
        if (me) {
          setCurrentUser(me);
          if (me.role === "admin") {
            loadUsers();
          }
        } else {
          router.push("/login");
        }
      } catch (err: any) {
        router.push("/login");
      } finally {
        setLoadingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch Users List
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setErrorMsg(null);
      const data = await fetchWithAuth("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load users list");
    } finally {
      setLoadingUsers(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Add User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim() || !newPassword) {
      alert(isArabic ? "برجاء ملء كافة الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }
    if (newPassword.length < 6) {
      alert(isArabic ? "كلمة المرور يجب ألا تقل عن 6 أحرف" : "Password must be at least 6 characters");
      return;
    }

    try {
      setSavingNewUser(true);
      setErrorMsg(null);
      await fetchWithAuth("/users", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail.trim(),
          display_name: newName.trim(),
          password: newPassword,
          role: newRole,
          is_active: newIsActive,
        }),
      });

      showSuccess(isArabic ? `تم إنشاء المستخدم (${newName}) بنجاح` : `User (${newName}) created successfully`);
      setIsAddModalOpen(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewRole("operator");
      setNewIsActive(true);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create user");
    } finally {
      setSavingNewUser(false);
    }
  };

  // Edit User Handler
  const openEditModal = (u: UserProfile) => {
    setSelectedUser(u);
    setEditName(u.display_name || "");
    setEditRole(u.role || "operator");
    setEditIsActive(u.is_active);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSavingEditUser(true);
      setErrorMsg(null);
      await fetchWithAuth(`/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify({
          display_name: editName.trim(),
          role: editRole,
          is_active: editIsActive,
        }),
      });

      showSuccess(isArabic ? "تم تحديث بيانات وصلاحيات المستخدم بنجاح" : "User details and role updated successfully");
      setIsEditModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update user");
    } finally {
      setSavingEditUser(false);
    }
  };

  // Reset Password Handler
  const openResetPassModal = (u: UserProfile) => {
    setSelectedUser(u);
    setAdminNewPassword("");
    setIsResetPassModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (adminNewPassword.length < 6) {
      alert(isArabic ? "كلمة المرور يجب ألا تقل عن 6 أحرف" : "Password must be at least 6 characters");
      return;
    }

    try {
      setSavingResetPass(true);
      setErrorMsg(null);
      await fetchWithAuth(`/users/${selectedUser.id}/reset-password`, {
        method: "PUT",
        body: JSON.stringify({
          new_password: adminNewPassword,
        }),
      });

      showSuccess(
        isArabic
          ? `تم إعادة تعيين كلمة المرور للمستخدم (${selectedUser.display_name}) بنجاح`
          : `Password reset successfully for (${selectedUser.display_name})`
      );
      setIsResetPassModalOpen(false);
      setAdminNewPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password");
    } finally {
      setSavingResetPass(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (u: UserProfile) => {
    if (currentUser && u.id === currentUser.id) {
      alert(isArabic ? "لا يمكنك حذف حسابك الحالي المسجل به الدخول!" : "You cannot delete your own active account!");
      return;
    }

    const confirmMsg = isArabic
      ? `هل أنت متأكد من رغبتك في حذف المستخدم (${u.display_name} - ${u.email}) نهائياً؟`
      : `Are you sure you want to permanently delete user (${u.display_name} - ${u.email})?`;

    if (!confirm(confirmMsg)) return;

    try {
      setErrorMsg(null);
      await fetchWithAuth(`/users/${u.id}`, { method: "DELETE" });
      showSuccess(isArabic ? "تم حذف المستخدم بنجاح" : "User deleted successfully");
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete user");
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.display_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (roleFilter === "active") return matchesSearch && u.is_active;
    if (roleFilter === "inactive") return matchesSearch && !u.is_active;
    if (roleFilter !== "all") return matchesSearch && u.role === roleFilter;

    return matchesSearch;
  });

  // Role Statistics
  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const operatorCount = users.filter((u) => u.role === "operator").length;
  const viewerCount = users.filter((u) => u.role === "viewer").length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  // Role Badges
  const renderRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>{isArabic ? "مدير نظام (Admin)" : "Administrator"}</span>
          </span>
        );
      case "operator":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{isArabic ? "مأمور عمليات (Operator)" : "Operator"}</span>
          </span>
        );
      case "viewer":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{isArabic ? "مشاهد (Viewer)" : "Viewer"}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {role}
          </span>
        );
    }
  };

  // Loading Screen
  if (loadingAuth) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-medium">
              {isArabic ? "جاري التحقق من الصلاحيات وأمان النظام..." : "Verifying security permissions..."}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // ACCESS DENIED SCREEN: Non-Admin Users
  if (currentUser && currentUser.role !== "admin") {
    return (
      <Layout>
        <Head>
          <title>{isArabic ? "صلاحيات الوصول مقصورة - شرطة النجدة 122" : "Access Denied - 122 Hotline"}</title>
        </Head>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center max-w-xl mx-auto" dir={dir}>
          <div className="w-20 h-20 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-6 shadow-md border border-red-200">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {isArabic ? "الصلاحيات مقصورة على مديري النظام فقط" : "Restricted Access: Administrators Only"}
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {isArabic
              ? `عذراً، حسابك الحالي مسجل برتبة (${currentUser.role === "operator" ? "مأمور عمليات" : "مشاهد"}). إدارة حسابات المستخدمين وتعيين الأدوار وتعديل الأمان مقصورة حصرياً على مديري النظام (Admin Role).`
              : `Access restricted. Your current account role is (${currentUser.role}). Managing users, resetting security keys, and assigning permissions is strictly reserved for administrators.`}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              {isArabic ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isArabic ? "العودة للرئيسية" : "Back to Dashboard"}</span>
            </Link>
            <Link
              href="/profile"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              {isArabic ? "ملفي الشخصي" : "My Profile"}
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ADMIN VIEW: Full User & Role Security Management
  return (
    <Layout>
      <Head>
        <title>{isArabic ? "إدارة المستخدمين والأدوار والأمان - النجدة 122" : "User Security & Roles - 122 Hotline"}</title>
      </Head>

      <div className="p-6 max-w-7xl mx-auto space-y-6" dir={dir}>
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-400/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {isArabic ? "إدارة مستخدمي المنظومة والأدوار الأمنية" : "Team Users & Role Security Management"}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-300/30 uppercase">
                  {isArabic ? "صلاحية المدير العام" : "Admin Only"}
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1">
                {isArabic
                  ? "إضافة المشغلين، توزيع رتب العمليات (مدير / مأمور عمليات / مشاهد)، وإعادة تعيين كلمات المرور والتحكم بحالات التفعيل."
                  : "Provision operators, assign operational roles (Admin / Operator / Viewer), reset security credentials, and manage activation."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadUsers}
              disabled={loadingUsers}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title={isArabic ? "تحديث القائمة" : "Refresh list"}
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isArabic ? "إضافة مستخدم جديد" : "Add New User"}</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="font-medium text-sm">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-sm">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{isArabic ? "إجمالي المستخدمين" : "Total Users"}</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-700">{isArabic ? "مديرو النظام" : "Admins"}</span>
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-900">{adminCount}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-700">{isArabic ? "مأمورو العمليات" : "Operators"}</span>
              <UserCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-900">{operatorCount}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">{isArabic ? "المشاهدون" : "Viewers"}</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{viewerCount}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-2xs col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-700">{isArabic ? "حسابات معطلة" : "Inactive"}</span>
              <UserX className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-800">{inactiveCount}</div>
          </div>
        </div>

        {/* RBAC Overview Matrix Ribbon */}
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-xl border border-indigo-100 p-4">
          <div className="flex items-center gap-2 mb-2 font-bold text-xs text-indigo-950 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>{isArabic ? "دليل الصلاحيات والأدوار في منظومة النجدة 122 (RBAC Policy):" : "122 RBAC Policy Reference:"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white/80 rounded-lg border border-purple-100">
              <div className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>{isArabic ? "مدير النظام (Admin)" : "System Admin"}</span>
              </div>
              <p className="text-slate-600 leading-normal">
                {isArabic
                  ? "كامل الصلاحيات: إدارة المستخدمين والأدوار، ضبط إعدادات المنظومة، واستعراض كافة البلاغات."
                  : "Full access: Manage team users, assign security roles, adjust system settings, and inspect all calls."}
              </p>
            </div>
            <div className="p-3 bg-white/80 rounded-lg border border-blue-100">
              <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>{isArabic ? "مأمور عمليات (Operator)" : "Operations Operator"}</span>
              </div>
              <p className="text-slate-600 leading-normal">
                {isArabic
                  ? "إدارة العمليات: متابعة المكالمات الحية، مراجعة استخراج البيانات والتسجيلات، والإشراف التشغيلي دون صلاحيات إدارة المستخدمين."
                  : "Operations: Monitor live calls, review data extractions & transcripts, and supervise operations without user admin rights."}
              </p>
            </div>
            <div className="p-3 bg-white/80 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>{isArabic ? "مشاهد (Viewer)" : "Read-only Viewer"}</span>
              </div>
              <p className="text-slate-600 leading-normal">
                {isArabic
                  ? "صلاحية استعراض فقط: مراقبة حركة لوحة التحكم والإحصائيات دون أي إمكانية للتعديل أو إدارة البلاغات الحساسة."
                  : "Read-only access: Monitor emergency metrics and review past summaries without modification capabilities."}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: "all", labelAr: `الكل (${totalCount})`, labelEn: `All (${totalCount})` },
              { id: "admin", labelAr: `المديرون (${adminCount})`, labelEn: `Admins (${adminCount})` },
              { id: "operator", labelAr: `مأمورو العمليات (${operatorCount})`, labelEn: `Operators (${operatorCount})` },
              { id: "viewer", labelAr: `المشاهدون (${viewerCount})`, labelEn: `Viewers (${viewerCount})` },
              { id: "inactive", labelAr: `معطل (${inactiveCount})`, labelEn: `Disabled (${inactiveCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  roleFilter === tab.id
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {isArabic ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className={`w-4 h-4 absolute ${isArabic ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
              className={`w-full text-xs py-2 ${
                isArabic ? "pr-9 pl-3" : "pl-9 pr-3"
              } bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all`}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" dir={dir}>
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">{isArabic ? "المستخدم" : "User Profile"}</th>
                  <th className="px-6 py-3.5">{isArabic ? "الرتبة والصلاحية" : "Role & Permissions"}</th>
                  <th className="px-6 py-3.5">{isArabic ? "حالة الحساب" : "Account Status"}</th>
                  <th className="px-6 py-3.5">{isArabic ? "تاريخ الإنشاء" : "Created At"}</th>
                  <th className="px-6 py-3.5 text-center">{isArabic ? "الإجراءات الأمنية" : "Security Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <span>{isArabic ? "لم يتم العثور على أي مستخدمين يطابقون البحث" : "No users matched the criteria"}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    const initials = (u.display_name || u.email || "U").slice(0, 2).toUpperCase();

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* User Profile */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm truncate">
                                  {u.display_name || "—"}
                                </span>
                                {isSelf && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700">
                                    {isArabic ? "حسابك الحالي" : "You"}
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 font-mono text-[11px] truncate flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          {renderRoleBadge(u.role)}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{isArabic ? "نشط ومفعل" : "Active"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              <span>{isArabic ? "معطل" : "Disabled"}</span>
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-4 text-slate-500 text-[11px] font-mono">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }) : "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Edit Role & Details */}
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200"
                              title={isArabic ? "تعديل الرتبة والبيانات" : "Edit Role & Details"}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => openResetPassModal(u)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors border border-slate-200"
                              title={isArabic ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={isSelf}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                isSelf
                                  ? "text-slate-300 border-slate-100 cursor-not-allowed"
                                  : "text-slate-600 hover:text-red-600 hover:bg-red-50 border-slate-200"
                              }`}
                              title={isSelf ? (isArabic ? "لا يمكنك حذف نفسك" : "Cannot delete yourself") : (isArabic ? "حذف المستخدم" : "Delete user")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: ADD NEW USER */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4" dir={dir}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isArabic ? "إضافة مستخدم جديد للمنظومة" : "Add New System User"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isArabic ? "إنشاء حساب مشغل جديد وتحديد دوره الأمني" : "Create operator credentials and set role"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isArabic ? "الاسم المعروض (الاسم الكامل):" : "Display Name (Full Name):"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={isArabic ? "مثال: مأمور أول أحمد محمود" : "e.g. Officer Ahmed Mahmoud"}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isArabic ? "البريد الإلكتروني / اسم الدخول:" : "Email / Username:"}
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="officer@nagda122.gov.eg"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isArabic ? "كلمة المرور الأولية (6 أحرف على الأقل):" : "Initial Password (min 6 chars):"}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full text-xs p-2.5 ${isArabic ? "pl-9 pr-2.5" : "pr-9 pl-2.5"} bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className={`absolute ${isArabic ? "left-2.5" : "right-2.5"} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600`}
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isArabic ? "الرتبة والدور الأمني (Security Role):" : "Security Role:"}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                  >
                    <option value="operator">{isArabic ? "مأمور عمليات (Operator) - معالجة المكالمات والاستخراج" : "Operator - Handle calls & triage"}</option>
                    <option value="admin">{isArabic ? "مدير نظام (Admin) - كامل الصلاحيات وإدارة المستخدمين" : "Admin - Full privileges & user management"}</option>
                    <option value="viewer">{isArabic ? "مشاهد (Viewer) - قراءة ومتابعة فقط" : "Viewer - Read-only monitoring"}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newActiveCheck"
                    checked={newIsActive}
                    onChange={(e) => setNewIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="newActiveCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                    {isArabic ? "تفعيل الحساب فوراً للسماح بتسجيل الدخول" : "Activate account immediately"}
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={savingNewUser}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {savingNewUser
                      ? (isArabic ? "جاري الإنشاء..." : "Creating...")
                      : (isArabic ? "إنشاء المستخدم" : "Create User")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT USER DETAILS & ROLE */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4" dir={dir}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isArabic ? "تعديل بيانات وصلاحيات المستخدم" : "Edit User & Role"}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isArabic ? "الاسم المعروض:" : "Display Name:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isArabic ? "الدور الأمني (Role):" : "Security Role:"}
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    disabled={currentUser?.id === selectedUser.id}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium disabled:opacity-60"
                  >
                    <option value="operator">{isArabic ? "مأمور عمليات (Operator)" : "Operator"}</option>
                    <option value="admin">{isArabic ? "مدير نظام (Admin)" : "Administrator"}</option>
                    <option value="viewer">{isArabic ? "مشاهد (Viewer)" : "Viewer"}</option>
                  </select>
                  {currentUser?.id === selectedUser.id && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      {isArabic ? "* لا يمكنك تغيير دور حسابك الخاص أثناء تسجيل الدخول به." : "* You cannot demote your own account role while logged in."}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editActiveCheck"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    disabled={currentUser?.id === selectedUser.id}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <label htmlFor="editActiveCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                    {isArabic ? "الحساب نشط ومفعل (Active)" : "Account is active"}
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={savingEditUser}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {savingEditUser
                      ? (isArabic ? "جاري الحفظ..." : "Saving...")
                      : (isArabic ? "حفظ التعديلات" : "Save Changes")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: RESET PASSWORD */}
        {isResetPassModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4" dir={dir}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isArabic ? "إعادة تعيين كلمة المرور" : "Reset User Password"}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResetPassModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-200/80">
                  {isArabic
                    ? `بصفتك مدير النظام، يمكنك تعيين كلمة مرور جديدة ومباشرة للمستخدم (${selectedUser.display_name}). سيتم تطبيق كلمة المرور فوراً.`
                    : `As an administrator, you are setting a new password directly for (${selectedUser.display_name}).`}
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isArabic ? "كلمة المرور الجديدة (6 أحرف على الأقل):" : "New Password (min 6 chars):"}
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPass ? "text" : "password"}
                      required
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full text-xs p-2.5 ${isArabic ? "pl-9 pr-2.5" : "pr-9 pl-2.5"} bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPass(!showResetPass)}
                      className={`absolute ${isArabic ? "left-2.5" : "right-2.5"} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600`}
                    >
                      {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResetPassModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={savingResetPass}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {savingResetPass
                      ? (isArabic ? "جاري التعيين..." : "Resetting...")
                      : (isArabic ? "تعيين كلمة المرور" : "Set New Password")}
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
