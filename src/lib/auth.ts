export type User = {
  id: string;
  email: string;
  name: string;
  passHash: string;
  createdAt: string;
};

export type Session = { userId: string; email: string };
export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

const USERS_KEY = "ip-dok-users";
const SESSION_KEY = "ip-dok-session";

function readUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* SHA-256, если доступен (https/localhost), иначе djb2-фолбэк */
async function hash(text: string): Promise<string> {
  try {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* небезопасный контекст — фолбэк */
  }
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return "djb2-" + (h >>> 0).toString(16);
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
    createdAt: new Date().toISOString().slice(0, 10),
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

export async function demoLogin(): Promise<AuthResult> {
  const users = readUsers();
  let user = users.find((u) => u.email === "demo@ip-dok.ru");
  if (!user) {
    user = {
      id: "u-demo",
      email: "demo@ip-dok.ru",
      name: "Демо-доступ",
      passHash: await hash("demo@ip-dok.ru::demo1234"),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    writeUsers([...users, user]);
  }
  saveSession({ userId: user.id, email: user.email });
  return { ok: true, user };
}

export function saveSession(s: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && typeof s.userId === "string" ? (s as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getUser(id: string): User | undefined {
  return readUsers().find((u) => u.id === id);
}

/* арифметическая капча, как в оригинале */
export function makeCaptcha(): { a: number; b: number } {
  return {
    a: 10 + Math.floor(Math.random() * 40),
    b: 10 + Math.floor(Math.random() * 40),
  };
}
