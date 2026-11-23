import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/context/LanguageContext";
import { fetchWithAuth } from "@/lib/api";
import {
  Shield,
  User,
  KeyRound,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Mail,
  Calendar,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function ProfilePage() {
  const { isArabic, dir } = useLanguage();

  // Current Logged-in User
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // Tab State: "profile" | "users"
  const [activeTab, setActiveTab] = useState<"profile" | "users">("profile");

  // Profile Form State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Users Management State (Admin only)
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // New User Form State
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState("operator");
  const [newIsActive, setNewIsActive] = useState(true);
  const [savingNewUser, setSavingNewUser] = useState(false);

  // Edit User Form State
  const [editUserRole, setEditUserRole] = useState("operator");
  const [editUserName, setEditUserName] = useState("");
  const [editUserActive, setEditUserActive] = useState(true);
  const [savingEditUser, setSavingEditUser] = useState(false);

  // Reset Password Modal State
  const [adminResetPass, setAdminResetPass] = useState("");
  const [savingResetPass, setSavingResetPass] = useState(false);

  // Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Current User Profile
  const loadMe = async () => {
    try {
      setLoadingMe(true);
      const data = await fetchWithAuth("/auth/me");
      if (data) {
        setCurrentUser(data);
        setEditName(data.display_name || "");
        setEditEmail(data.email || "");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load profile");
    } finally {
      setLoadingMe(false);
    }
  };

  // Load All Users (for Admins)
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await fetchWithAuth("/users");
      setUsersList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // Non-admins will get 403, which is expected
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadUsers();
    }
  }, [currentUser]);

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert(isArabic ? "برجاء إدخال الاسم" : "Please enter display name");
      return;
    }

    try {
      setSavingProfile(true);
      setErrorMsg(null);
      const updated = await fetchWithAuth("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          display_name: editName.trim(),
          email: editEmail.trim(),
        }),
      });
      setCurrentUser(updated);
      setSuccessMsg(isArabic ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      alert(isArabic ? "برجاء إدخال كلمة المرور الحالية" : "Please enter current password");
      return;
    }
    if (newPassword.length < 6) {
      alert(isArabic ? "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" : "New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert(isArabic ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }

    try {
      setSavingPassword(true);
      setErrorMsg(null);
      await fetchWithAuth("/auth/password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMsg(isArabic ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  // Admin: Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPass) {
      alert(isArabic ? "برجاء استيفاء جميع الحقول" : "Please fill in all fields");
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
          password: newPass,
          role: newRole,
          is_active: newIsActive,
        }),
      });
      setIsAddUserModalOpen(false);
      setNewEmail("");
      setNewName("");
      setNewPass("");
      setNewRole("operator");
      setSuccessMsg(isArabic ? "تم إضافة المستخدم الجديد بنجاح" : "User created successfully");
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create user");
    } finally {
      setSavingNewUser(false);
    }
  };

  // Admin: Edit User
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSavingEditUser(true);
      setErrorMsg(null);
      await fetchWithAuth(`/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify({
          display_name: editUserName.trim(),
          role: editUserRole,
          is_active: editUserActive,
        }),
      });
      setIsEditUserModalOpen(false);
      setSuccessMsg(isArabic ? "تم تحديث بيانات وصلاحيات المستخدم" : "User permissions updated");
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update user");
    } finally {
      setSavingEditUser(false);
    }
  };

  // Admin: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !adminResetPass) return;

    try {
      setSavingResetPass(true);
      setErrorMsg(null);
      await fetchWithAuth(`/users/${selectedUser.id}/reset-password`, {
        method: "PUT",
        body: JSON.stringify({ new_password: adminResetPass }),
      });
      setIsResetPassModalOpen(false);
      setAdminResetPass("");
      setSuccessMsg(
        isArabic
          ? `تم إعادة تعيين كلمة المرور للمستخدم ${selectedUser.email}`
          : `Password reset successfully for ${selectedUser.email}`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password");
    } finally {
      setSavingResetPass(false);
    }
  };

  // Admin: Delete User
  const handleDeleteUser = async (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      alert(isArabic ? "لا يمكنك حذف حسابك الحالي" : "You cannot delete your own account");
      return;
    }
    const confirmPrompt = isArabic
      ? `هل أنت متأكد من حذف المستخدم "${user.display_name || user.email}"؟`
      : `Are you sure you want to delete user "${user.display_name || user.email}"?`;
    if (!window.confirm(confirmPrompt)) return;

    try {
      await fetchWithAuth(`/users/${user.id}`, { method: "DELETE" });
      setSuccessMsg(isArabic ? "تم حذف المستخدم بنجاح" : "User deleted successfully");
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  const openEditUserModal = (u: UserProfile) => {
    setSelectedUser(u);
    setEditUserName(u.display_name || "");
    setEditUserRole(u.role || "operator");
    setEditUserActive(u.is_active);
    setIsEditUserModalOpen(true);
  };

  const openResetPassModal = (u: UserProfile) => {
    setSelectedUser(u);
    setAdminResetPass("");
    setIsResetPassModalOpen(true);
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.display_name || "").toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Admin / مدير نظام</span>;
      case "operator":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Operator / مأمور عمليات</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Viewer / مشاهد</span>;
    }
  };

  return (
    <Layout>
      <Head>
        <title>{isArabic ? "الملف الشخصي وإدارة الأمان - النجدة 122" : "Profile & Security - 122 Hotline"}</title>
      </Head>

      <div className="p-6 max-w-7xl mx-auto space-y-6" dir={dir}>
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-400/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {isArabic ? "الملف الشخصي وإدارة أمان المستخدمين" : "Profile & User Security Administration"}
              </h1>
              <p className="text-slate-300 text-sm">
                {isArabic
                  ? "تعديل بيانات الحساب، تغيير كلمة المرور، وإدارة صلاحيات وصول المشغلين والمديرين."
                  : "Manage personal profile, change security password, and administer team role permissions."}
              </p>
            </div>
          </div>

          {currentUser?.role === "admin" && (
            <div className="flex items-center gap-2">
              <Link
                href="/users"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition-all flex items-center gap-1.5 shrink-0"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isArabic ? `إدارة جميع المستخدمين والأدوار (${usersList.length})` : `Manage All Users & Roles (${usersList.length})`}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: My Profile & Password */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: User Card & Role Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3 shadow-md">
                  {(currentUser?.display_name || currentUser?.email || "U").slice(0, 2).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{currentUser?.display_name || "User"}</h3>
                <p className="text-xs text-slate-500 font-mono mb-3">{currentUser?.email}</p>
                <div className="mb-4">{getRoleBadge(currentUser?.role || "operator")}</div>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isArabic ? "حالة الحساب:" : "Account Status:"}</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      {isArabic ? "نشط ومفعل" : "Active"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isArabic ? "معرف المستخدم:" : "User ID:"}</span>
                    <span className="font-mono text-[10px] text-slate-600">
                      {currentUser?.id ? `${currentUser.id.slice(0, 8)}...` : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Access Info Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>{isArabic ? "صلاحيات دورك في المنظومة:" : "Role Permissions:"}</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  {currentUser?.role === "admin" ? (
                    <>
                      <li>{isArabic ? "إدارة كاملة للنظام والمستخدمين والصلاحيات" : "Full access to settings, users & RBAC"}</li>
                      <li>{isArabic ? "ضبط إعدادات الذكاء الاصطناعي وتخصيص أسئلة البلاغات" : "Configure AI settings & emergency questionnaire"}</li>
                      <li>{isArabic ? "استقبال ومتابعة واستعراض كافة المكالمات والبلاغات" : "Monitor live calls & post-call extractions"}</li>
                    </>
                  ) : currentUser?.role === "operator" ? (
                    <>
                      <li>{isArabic ? "استقبال والتعامل مع المكالمات الحية والبلاغات" : "Manage live calls & citizen reports"}</li>
                      <li>{isArabic ? "استعراض سجل البلاغات ومراجعة الاستخراجات" : "Review call logs & structured extractions"}</li>
                      <li>{isArabic ? "تعديل الملف الشخصي وكلمة المرور الخاصة" : "Update personal profile & password"}</li>
                    </>
                  ) : (
                    <>
                      <li>{isArabic ? "استعراض سجل المكالمات والتقارير الإحصائية" : "View call transcripts & dashboard metrics"}</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Right: Edit Profile & Change Password Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Form 1: Edit Profile Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-base">
                    {isArabic ? "تعديل البيانات الأساسية" : "Edit Profile Information"}
                  </h3>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isArabic ? "الاسم المعروض" : "Display Name"} *
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isArabic ? "البريد الإلكتروني" : "Email Address"} *
                      </label>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 rounded-xl font-medium shadow-sm transition-all active:scale-95"
                    >
                      {savingProfile
                        ? isArabic
                          ? "جاري الحفظ..."
                          : "Saving..."
                        : isArabic
                        ? "حفظ التعديلات"
                        : "Save Profile"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Form 2: Change Password */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-base">
                    {isArabic ? "تغيير كلمة المرور والأمان" : "Change Password & Security"}
                  </h3>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isArabic ? "كلمة المرور الحالية" : "Current Password"} *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className={`absolute top-2.5 ${isArabic ? "left-3" : "right-3"} text-slate-400 hover:text-slate-600`}
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New and Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isArabic ? "كلمة المرور الجديدة (6 أحرف فأكثر)" : "New Password (Min 6 chars)"} *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className={`absolute top-2.5 ${isArabic ? "left-3" : "right-3"} text-slate-400 hover:text-slate-600`}
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isArabic ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"} *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-5 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 rounded-xl font-medium shadow-sm transition-all active:scale-95"
                    >
                      {savingPassword
                        ? isArabic
                          ? "جاري التغيير..."
                          : "Updating..."
                        : isArabic
                        ? "تحديث كلمة المرور"
                        : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: User Security & RBAC Management (Admin Only) */}
        {activeTab === "users" && currentUser?.role === "admin" && (
          <div className="space-y-6">
            {/* Filter and Add Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder={isArabic ? "بحث بالاسم أو البريد..." : "Search user or email..."}
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{isArabic ? "جميع الأدوار" : "All Roles"}</option>
                  <option value="admin">Admin</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium shadow-sm transition-all active:scale-95 w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>{isArabic ? "إضافة مستخدم جديد" : "Add User Account"}</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-slate-600 text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">{isArabic ? "المستخدم" : "User"}</th>
                    <th className="px-6 py-3.5">{isArabic ? "الدور والصلاحية" : "Role"}</th>
                    <th className="px-6 py-3.5">{isArabic ? "الحالة" : "Status"}</th>
                    <th className="px-6 py-3.5">{isArabic ? "تاريخ الإنشاء" : "Created At"}</th>
                    <th className="px-6 py-3.5 text-right">{isArabic ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <Sparkles className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        <span>{isArabic ? "جاري تحميل المستخدمين..." : "Loading users..."}</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        {isArabic ? "لا يوجد مستخدمين مطابقين" : "No users found"}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {(u.display_name || u.email || "U").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{u.display_name || "User"}</div>
                              <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                        <td className="px-6 py-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {isArabic ? "نشط" : "Active"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              {isArabic ? "معطل" : "Disabled"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditUserModal(u)}
                              title={isArabic ? "تعديل الصلاحيات" : "Edit Role & Details"}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openResetPassModal(u)}
                              title={isArabic ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {u.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title={isArabic ? "حذف المستخدم" : "Delete User"}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Add User */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>{isArabic ? "إضافة حساب مستخدم جديد" : "Add User Account"}</span>
                </h3>
                <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isArabic ? "الاسم المعروض" : "Display Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={isArabic ? "مثال: مأمور أحمد سمير" : "e.g. Officer Ahmed Samir"}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isArabic ? "البريد الإلكتروني" : "Email Address"} *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="officer@callcenter.poc"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isArabic ? "كلمة المرور الأولية" : "Initial Password"} *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isArabic ? "الدور والصلاحية" : "Role"} *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="operator">{isArabic ? "Operator - مأمور عمليات وبلاغات" : "Operator"}</option>
                    <option value="admin">{isArabic ? "Admin - مدير نظام كامل" : "Admin"}</option>
                    <option value="viewer">{isArabic ? "Viewer - مشاهد فقط" : "Viewer"}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newIsActive"
                    checked={newIsActive}
                    onChange={(e) => setNewIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="newIsActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                    {isArabic ? "تفعيل الحساب فوراً" : "Active account"}
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={savingNewUser}
                    className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 rounded-xl shadow-sm"
                  >
                    {savingNewUser ? (isArabic ? "جاري الإضافة..." : "Adding...") : (isArabic ? "إضافة المستخدم" : "Add User")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit User Role & Status */}
        {isEditUserModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-400" />
                  <span>{isArabic ? "تعديل صلاحيات المستخدم" : "Edit User Role"}</span>
                </h3>
                <button onClick={() => setIsEditUserModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isArabic ? "الاسم المعروض" : "Display Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isArabic ? "الدور والصلاحية" : "Role"}
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="operator">Operator - مأمور عمليات وبلاغات</option>
                    <option value="admin">Admin - مدير نظام كامل</option>
                    <option value="viewer">Viewer - مشاهد فقط</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editUserActive"
                    checked={editUserActive}
                    onChange={(e) => setEditUserActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="editUserActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                    {isArabic ? "الحساب نشط ومفعل" : "Active account"}
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditUserModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={savingEditUser}
                    className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 rounded-xl shadow-sm"
                  >
                    {savingEditUser ? (isArabic ? "جاري الحفظ..." : "Saving...") : (isArabic ? "حفظ التعديل" : "Save Changes")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reset User Password */}
        {isResetPassModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-400" />
                  <span>{isArabic ? "إعادة تعيين كلمة المرور" : "Reset Password"}</span>
                </h3>
                <button onClick={() => setIsResetPassModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                <p className="text-xs text-slate-500">
                  {isArabic
                    ? `أدخل كلمة المرور الجديدة للمستخدم: ${selectedUser.email}`
                    : `Set new password for user: ${selectedUser.email}`}
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isArabic ? "كلمة المرور الجديدة" : "New Password"} *
                  </label>
                  <input
                    type="password"
                    required
                    value={adminResetPass}
                    onChange={(e) => setAdminResetPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsResetPassModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={savingResetPass}
                    className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 rounded-xl shadow-sm"
                  >
                    {savingResetPass ? (isArabic ? "جاري التعيين..." : "Resetting...") : (isArabic ? "تعيين كلمة المرور" : "Reset Password")}
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
