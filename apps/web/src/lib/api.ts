import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Dynamically resolves the API base URL based on where the app is deployed and served.
 * Zero hardcoded domains: works on localhost, custom desktop ports, LAN IPs, or remote server domains.
 */
export function getApiBaseUrl(): string {
  // 1. Check if user configured a manual API URL override in browser storage
  if (typeof window !== "undefined") {
    const customUrl = localStorage.getItem("api_base_url");
    if (customUrl && customUrl.trim() !== "") {
      return customUrl.trim().endsWith("/") ? customUrl.trim().slice(0, -1) : customUrl.trim();
    }
  }

  // 2. Check build-time environment variable if explicitly configured
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    if (typeof window !== "undefined") {
      const isLocalHost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "::1";
      const envIsRemote = envUrl.startsWith("http") && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1");

      // If viewing on localhost and envUrl points to a remote domain, prioritize local API instead of failing
      if (!isLocalHost || !envIsRemote) {
        return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
      }
    } else {
      return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
    }
  }

  // 3. Dynamic runtime resolution from current browser window location
  if (typeof window !== "undefined") {
    const { protocol, hostname, port, pathname } = window.location;
    const isLocalHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1";

    // A) Local development on Next.js dev port 3000 / 3001
    // Connects to local FastAPI backend running on port 8000
    if (isLocalHost && (port === "3000" || port === "3001")) {
      return `${protocol}//${hostname}:8000/api/v1`;
    }

    // B) Local network / LAN IP access (e.g. 192.168.x.x:3000)
    if (port === "3000" || port === "3001") {
      return `${protocol}//${hostname}:8000/api/v1`;
    }

    // C) App served directly on API port 8000
    if (port === "8000") {
      return `${protocol}//${hostname}:${port}/api/v1`;
    }

    // D) Production or server deployment with subpath /122Nagda/
    // Points to the renamed Python API backend at /122/api/v1
    if (pathname.startsWith("/122Nagda")) {
      return `${window.location.origin}/122/api/v1`;
    }

    // E) Production or server deployment under root domain
    return `${window.location.origin}/api/v1`;
  }

  // Server-side rendering (SSR) fallback
  return "http://localhost:8000/api/v1";
}

/**
 * Returns the dynamic base path for routing and redirects.
 */
export function getAppBasePath(): string {
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/122Nagda")) {
      return "/122Nagda";
    }
  }
  return "";
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token");
    const basePath = getAppBasePath();
    window.location.href = `${basePath}/login/`;
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP Error ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

/**
 * Formats ISO timestamps into clean, human-readable date and time strings.
 */
export function formatCallDateTime(dateStr?: string | null): { date: string; time: string; full: string } {
  if (!dateStr) return { date: "—", time: "—", full: "—" };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: "—", time: "—", full: "—" };
    const date = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return {
      date,
      time,
      full: `${date} ${time}`,
    };
  } catch {
    return { date: "—", time: "—", full: "—" };
  }
}

