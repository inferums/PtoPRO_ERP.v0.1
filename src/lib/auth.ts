import { supabase } from "./supabase";
import type { UserContext } from "./db-types";
import { fetchUserContext } from "./api";

export type { UserContext };

export type Session = {
  userId: string;
  email: string;
};

export type AuthResult =
  | { ok: true; user: { id: string; email: string; name: string } }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ─── Register ──────────────────────────────────────────────── */

export async function register(email: string, password: string, orgName: string, fullName?: string): Promise<AuthResult> {
  const mail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(mail)) return { ok: false, error: "Похоже, в email опечатка" };
  if (password.length < 6) return { ok: false, error: "Пароль — минимум 6 символов" };
  const name = orgName.trim() || mail.split("@")[0];

  const { data, error } = await supabase.auth.signUp({
    email: mail,
    password,
    options: {
      data: { org_name: name, full_name: fullName?.trim() || name },
    },
  });

  if (error) {
    if (error.message.includes("already")) return { ok: false, error: "Такой email уже зарегистрирован — войдите" };
    return { ok: false, error: error.message };
  }
  if (!data.user) return { ok: false, error: "Не удалось создать аккаунт" };

  return { ok: true, user: { id: data.user.id, email: mail, name } };
}

/* ─── Login ─────────────────────────────────────────────────── */

export async function login(email: string, password: string): Promise<AuthResult> {
  const mail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password });
  if (error) {
    if (error.message.includes("Invalid")) return { ok: false, error: "Неверный пароль" };
    if (error.message.includes("not found")) return { ok: false, error: "Аккаунт с таким email не найден" };
    return { ok: false, error: error.message };
  }
  if (!data.user) return { ok: false, error: "Не удалось войти" };

  return { ok: true, user: { id: data.user.id, email: mail, name: data.user.user_metadata?.full_name ?? mail.split("@")[0] } };
}

/* ─── Session ───────────────────────────────────────────────── */

export async function loadSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return { userId: session.user.id, email: session.user.email ?? "" };
}

export function clearSession() {
  supabase.auth.signOut();
}

/* ─── Auth state listener ───────────────────────────────────── */

export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({ userId: session.user.id, email: session.user.email ?? "" });
    } else {
      callback(null);
    }
  });
}

/* ─── Full user context (org, permissions, etc.) ────────────── */

export { fetchUserContext };
