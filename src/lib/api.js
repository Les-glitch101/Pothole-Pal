// Thin fetch wrapper for the PotholePal API. Sessions live in localStorage,
// one key per role, so the resident app and the staff portal can be signed in
// at the same time in the same browser while two different browsers stay
// completely independent.
const KEYS = { resident: "pp.session.resident", staff: "pp.session.staff" };

export function getSession(role) {
  try {
    const raw = localStorage.getItem(KEYS[role]);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(role, session) {
  localStorage.setItem(KEYS[role], JSON.stringify(session));
}

export function clearSession(role) {
  localStorage.removeItem(KEYS[role]);
}

// The photo in the report draft is either a blob URL (taken or picked file)
// or a data URL (the sample photo). Both convert to a Blob for multipart POSTs.
export async function photoToBlob(src) {
  if (!src) return null;
  if (src.startsWith("blob:") || src.startsWith("data:")) {
    const res = await fetch(src);
    return await res.blob();
  }
  return null;
}

export async function api(path, { method = "GET", body, form, role = "resident" } = {}) {
  const session = getSession(role);
  const headers = {};
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  if (body && !form) headers["Content-Type"] = "application/json";

  const res = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  });

  if (res.status === 401) {
    clearSession(role);
    window.location.assign(role === "staff" ? "/staff" : "/login");
    throw new Error("Please sign in.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Request failed (${res.status}).`);
    err.code = data?.error?.code;
    err.ref = data?.error?.ref;
    err.status = res.status;
    throw err;
  }
  return data;
}
