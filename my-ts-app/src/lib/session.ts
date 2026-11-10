import axios from "axios";

const KEY = "sts_token";

// The login token lives in sessionStorage: a page refresh keeps you signed in, closing the tab signs you out.
// (Storage can be blocked in private windows, so every access is wrapped.)
export const getToken = (): string | null => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
export const setToken = (t: string) => { try { sessionStorage.setItem(KEY, t); } catch { /* storage unavailable */ } };
export const clearToken = () => { try { sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ } };

// every request carries the token...
axios.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ...and an expired / invalid token (anywhere except the login call itself) sends the user back to sign in
axios.interceptors.response.use(
  (r) => r,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401 && !String(err.config?.url).endsWith("/login")) {
      clearToken();
      window.dispatchEvent(new Event("sts:logout"));
    }
    return Promise.reject(err);
  },
);

/** A sentence a person can understand for any failed request. */
export function errorText(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(e)) {
    if (!e.response) return "Cannot reach the server. Check that the backend is running.";
    const d = e.response.data as { message?: string; errors?: { message: string }[] } | undefined;
    if (d?.errors?.length) return d.errors.map((x) => x.message).join(" ");
    if (typeof d?.message === "string") return d.message;
    if (e.response.status >= 500) return "The server had a problem. Please try again.";
  }
  return fallback;
}
