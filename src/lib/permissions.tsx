import { createContext, useContext, useMemo } from "react";
import type { SectionPermission, UserContext } from "./db-types";
import type { View } from "./store";

/* ─── View → section mapping ────────────────────────────────── */

const VIEW_SECTION: Record<View, string> = {
  dashboard: "dashboard",
  contracts: "contracts",
  invoices: "invoices",
  acts: "acts",
  finance: "finance",
  letters: "letters",
  parties: "parties",
  settings: "settings",
};

/* ─── Merged permissions context ────────────────────────────── */

export type PermissionsApi = {
  /** Full section permission (merged from all user groups) */
  forSection(section: string): SectionPermission;
  /** Shortcut: can the user see this view? */
  canView(view: View): boolean;
  canCreate(view: View): boolean;
  canEdit(view: View): boolean;
  canDelete(view: View): boolean;
  /** Is a specific field hidden in this view? */
  isFieldHidden(view: View, field: string): boolean;
  /** Is the current user an admin? */
  isAdmin: boolean;
  /** Raw permissions array */
  all: SectionPermission[];
};

const EMPTY_PERM: SectionPermission = {
  section: "", can_view: false, can_create: false, can_edit: false, can_delete: false, hidden_fields: [],
};

function buildPermsApi(ctx: UserContext | null): PermissionsApi {
  const map = new Map<string, SectionPermission>();

  if (ctx) {
    /* Admin always has full access */
    if (ctx.role === "admin") {
      const sections = ["dashboard", "contracts", "invoices", "acts", "finance", "letters", "parties", "settings"];
      for (const s of sections) {
        map.set(s, { section: s, can_view: true, can_create: true, can_edit: true, can_delete: true, hidden_fields: [] });
      }
    } else {
      for (const p of ctx.permissions) {
        const existing = map.get(p.section);
        if (existing) {
          existing.can_view = existing.can_view || p.can_view;
          existing.can_create = existing.can_create || p.can_create;
          existing.can_edit = existing.can_edit || p.can_edit;
          existing.can_delete = existing.can_delete || p.can_delete;
          existing.hidden_fields = [...new Set([...existing.hidden_fields, ...p.hidden_fields])];
        } else {
          map.set(p.section, { ...p, hidden_fields: [...p.hidden_fields] });
        }
      }
    }
  }

  const get = (section: string): SectionPermission => map.get(section) ?? EMPTY_PERM;

  return {
    forSection: get,
    canView: (v) => get(VIEW_SECTION[v]).can_view,
    canCreate: (v) => get(VIEW_SECTION[v]).can_create,
    canEdit: (v) => get(VIEW_SECTION[v]).can_edit,
    canDelete: (v) => get(VIEW_SECTION[v]).can_delete,
    isFieldHidden: (v, field) => get(VIEW_SECTION[v]).hidden_fields.includes(field),
    isAdmin: ctx?.role === "admin",
    all: Array.from(map.values()),
  };
}

/* ─── React context ─────────────────────────────────────────── */

const PermissionsContext = createContext<PermissionsApi>(buildPermsApi(null));

export function PermissionsProvider({ ctx, children }: { ctx: UserContext | null; children: React.ReactNode }) {
  const api = useMemo(() => buildPermsApi(ctx), [ctx]);
  return <PermissionsContext.Provider value={api}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): PermissionsApi {
  return useContext(PermissionsContext);
}
