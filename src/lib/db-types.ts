/* ─── DB row types (snake_case) ─────────────────────────────── */

export type DbOrganization = {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DbProfile = {
  id: string;
  org_id: string;
  full_name: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
};

export type DbGroup = {
  id: string;
  org_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type DbGroupMember = {
  group_id: string;
  profile_id: string;
  created_at: string;
};

export type DbPermission = {
  id: string;
  group_id: string;
  section: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  hidden_fields: string[];
};

export type DbOrgDetails = {
  org_id: string;
  full_name: string;
  short_name: string;
  inn: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  bank: string;
  corr_account: string;
  bik: string;
  account: string;
  director: string;
  updated_at: string;
};

export type DbParty = {
  id: string;
  org_id: string;
  name: string;
  inn: string;
  person: string;
  bank: string;
  bik: string;
  account: string;
  created_at: string;
  updated_at: string;
};

export type DbContract = {
  id: string;
  org_id: string;
  number: string;
  counterparty_id: string | null;
  subject: string;
  kind: "income" | "expense";
  planned_income: number;
  planned_expense: number;
  actual_income: number;
  actual_expense: number;
  status: "active" | "completed" | "terminated";
  start_date: string;
  end_date: string;
  parent_id: string | null;
  description: string;
  created_at: string;
  updated_at: string;
};

export type DbDocument = {
  id: string;
  org_id: string;
  number: number;
  type: "invoice" | "act";
  status: "draft" | "sent" | "signed" | "paid_partial" | "paid";
  date: string;
  counterparty_id: string | null;
  contract_id: string | null;
  vat: boolean;
  note: string;
  created_at: string;
  updated_at: string;
};

export type DbDocumentItem = {
  id: string;
  document_id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  sort_order: number;
};

export type DbPayment = {
  id: string;
  org_id: string;
  doc_id: string | null;
  date: string;
  amount: number;
  method: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type DbLetter = {
  id: string;
  org_id: string;
  number: string;
  date: string;
  counterparty_id: string | null;
  direction: "in" | "out";
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
};

/* ─── Effective permissions for a user ──────────────────────── */

export type SectionPermission = {
  section: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  hidden_fields: string[];
};

/* ─── Organization settings (stored in org.settings jsonb) ──── */

export type OrgSettings = {
  enabledSections?: string[];
  currency?: string;
  timezone?: string;
};

/* ─── Current user context (cached after login) ─────────────── */

export type UserContext = {
  userId: string;
  email: string;
  orgId: string;
  orgName: string;
  orgLogoUrl: string | null;
  role: "admin" | "user";
  fullName: string;
  permissions: SectionPermission[];
  orgSettings: OrgSettings;
};
