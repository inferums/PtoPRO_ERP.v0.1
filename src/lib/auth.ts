export type User = {
  id: string;
  email: string;
  name: string;
  passHash: string;
};

export type Session = { userId: string; email: string };
export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

const USERS_KEY = "ip-dok-v2:users";
const SESSION_KEY = "ip-dok-v2:session";

function readUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: User[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* приватный режим */
  }
}

/* SHA-256, если доступен (https); иначе детерминированный фолбэк,
   чтобы вход работал и на http-превью */
async function hash(s: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* fallthrough */
  }
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function register(email: string, password: string, name?: string): Promise<AuthResult> {
  const mail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(mail)) return { ok: false, error: "Похоже, в email опечатка" };
  if (password.length < 6) return { ok: false, error: "Пароль — минимум 6 символов" };
  const users = readUsers();
  if (users.some((u) => u.email === mail)) return { ok: false, error: "Такой email уже зарегистрирован — войдите" };
  const user: User = {
    id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    email: mail,
    name: name?.trim() || mail.split("@")[0],
    passHash: await hash(mail + "::" + password),
  };
  writeUsers([...users, user]);
  saveSession({ userId: user.id, email: user.email });
  return { ok: true, user };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const mail = email.trim().toLowerCase();
  const user = readUsers().find((u) => u.email === mail);
  if (!user) return { ok: false, error: "Аккаунт с таким email не найден" };
  const passHash = await hash(mail + "::" + password);
  if (passHash !== user.passHash) return { ok: false, error: "Неверный пароль" };
  saveSession({ userId: user.id, email: user.email });
  return { ok: true, user };
}

/* демо-доступ: создаётся один раз, данные наполняются извне */
export async function demoLogin(): Promise<AuthResult> {
  const users = readUsers();
  let user = users.find((u) => u.email === "demo@ip-dok.ru");
  if (!user) {
    user = {
      id: "u-demo",
      email: "demo@ip-dok.ru",
      name: "Демо-доступ",
      passHash: await hash("demo@ip-dok.ru::demo"),
    };
    writeUsers([...users, user]);
  }
  saveSession({ userId: user.id, email: user.email });
  return { ok: true, user };
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s && s.userId ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* приватный режим */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* приватный режим */
  }
}
