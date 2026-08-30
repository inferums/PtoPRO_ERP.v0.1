import { supabase } from "./supabase";
import type {
  DbParty, DbContract, DbDocument, DbDocumentItem, DbPayment, DbLetter,
  DbOrganization, DbOrgDetails, DbGroup, DbGroupMember, DbPermission,
  DbProfile,
  SectionPermission, UserContext, OrgSettings,
} from "./db-types";
import type {
  Party, Contract, Doc, LineItem, Payment, Letter, Own, State,
} from "./store";

/* ═══════════════════════════════════════════════════════════════
   CONVERSION HELPERS: DB rows ↔ frontend types
   ═══════════════════════════════════════════════════════════════ */

export function rowToParty(r: DbParty): Party {
  return { id: r.id, name: r.name, inn: r.inn || undefined, person: r.person || undefined, bank: r.bank || undefined, bik: r.bik || undefined, account: r.account || undefined };
}

export function partyToRow(p: Party, orgId: string): Partial<DbParty> {
  return { org_id: orgId, name: p.name, inn: p.inn ?? "", person: p.person ?? "", bank: p.bank ?? "", bik: p.bik ?? "", account: p.account ?? "" };
}

export function rowToContract(r: DbContract): Contract {
  return {
    id: r.id, number: r.number, counterpartyId: r.counterparty_id ?? "", subject: r.subject,
    kind: r.kind, plannedIncome: r.planned_income, plannedExpense: r.planned_expense,
    actualIncome: r.actual_income, actualExpense: r.actual_expense, status: r.status,
    startDate: r.start_date, endDate: r.end_date, parentId: r.parent_id ?? undefined, description: r.description || undefined,
  };
}

export function contractToRow(c: Contract, orgId: string): Partial<DbContract> {
  return {
    org_id: orgId, number: c.number, counterparty_id: c.counterpartyId || null, subject: c.subject,
    kind: c.kind, planned_income: c.plannedIncome, planned_expense: c.plannedExpense,
    actual_income: c.actualIncome, actual_expense: c.actualExpense, status: c.status,
    start_date: c.startDate, end_date: c.endDate, parent_id: c.parentId ?? null, description: c.description ?? "",
  };
}

export function rowToDoc(r: DbDocument, items: DbDocumentItem[]): Doc {
  return {
    id: r.id, number: r.number, type: r.type, status: r.status, date: r.date,
    counterpartyId: r.counterparty_id ?? "", contractId: r.contract_id ?? undefined,
    vat: r.vat, note: r.note || undefined,
    items: items.sort((a, b) => a.sort_order - b.sort_order).map((it) => ({
      id: it.id, name: it.name, qty: it.qty, unit: it.unit, price: it.price,
    })),
  };
}

export function docToRows(doc: Doc, orgId: string): { document: Partial<DbDocument>; items: Partial<DbDocumentItem>[] } {
  return {
    document: {
      org_id: orgId, number: doc.number, type: doc.type, status: doc.status, date: doc.date,
      counterparty_id: doc.counterpartyId || null, contract_id: doc.contractId ?? null, vat: doc.vat, note: doc.note ?? "",
    },
    items: doc.items.map((it, i) => ({
      name: it.name, qty: it.qty, unit: it.unit, price: it.price, sort_order: i,
    })),
  };
}

export function rowToPayment(r: DbPayment): Payment {
  return { id: r.id, docId: r.doc_id ?? "", date: r.date, amount: r.amount, method: r.method, name: r.name };
}

export function paymentToRow(p: Payment, orgId: string): Partial<DbPayment> {
  return { org_id: orgId, doc_id: p.docId || null, date: p.date, amount: p.amount, method: p.method, name: p.name };
}

export function rowToLetter(r: DbLetter): Letter {
  return { id: r.id, number: r.number, date: r.date, counterpartyId: r.counterparty_id ?? "", direction: r.direction, subject: r.subject, body: r.body };
}

export function letterToRow(l: Letter, orgId: string): Partial<DbLetter> {
  return { org_id: orgId, number: l.number, date: l.date, counterparty_id: l.counterpartyId || null, direction: l.direction, subject: l.subject, body: l.body };
}

export function rowToOwn(details: DbOrgDetails | null): Own {
  if (!details) return { name: "", short: "", bank: "", bik: "", account: "", director: "" };
  return {
    name: details.full_name, short: details.short_name, inn: details.inn || undefined,
    address: details.address || undefined, phone: details.phone || undefined,
    email: details.email || undefined, website: details.website || undefined,
    bank: details.bank, corrAccount: details.corr_account || undefined,
    bik: details.bik, account: details.account, director: details.director,
  };
}

export function ownToRow(own: Own): Partial<DbOrgDetails> {
  return {
    full_name: own.name, short_name: own.short, inn: own.inn ?? "",
    address: own.address ?? "", phone: own.phone ?? "", email: own.email ?? "",
    website: own.website ?? "", bank: own.bank, corr_account: own.corrAccount ?? "",
    bik: own.bik, account: own.account, director: own.director,
  };
}

/* ═══════════════════════════════════════════════════════════════
   USER CONTEXT
   ═══════════════════════════════════════════════════════════════ */

export async function fetchUserContext(): Promise<UserContext | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: orgPerms }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.rpc("get_all_user_permissions"),
  ]);
  if (!profile) return null;

  const { data: org } = await supabase.from("organizations").select("*").eq("id", profile.org_id).single();
  if (!org) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    orgId: org.id,
    orgName: org.name,
    orgLogoUrl: org.logo_url,
    role: profile.role,
    fullName: profile.full_name,
    permissions: (orgPerms ?? []) as SectionPermission[],
    orgSettings: (org.settings ?? {}) as OrgSettings,
  };
}

/* ═══════════════════════════════════════════════════════════════
   ORGANIZATION
   ═══════════════════════════════════════════════════════════════ */

export async function fetchOrgDetails(orgId: string): Promise<Own> {
  const { data, error } = await supabase.from("org_details").select("*").eq("org_id", orgId).single();
  if (error) return { name: "", short: "", bank: "", bik: "", account: "", director: "" };
  return rowToOwn(data);
}

export async function saveOrgDetails(orgId: string, own: Own) {
  const row = ownToRow(own);
  const { error } = await supabase.from("org_details").upsert({ org_id: orgId, ...row });
  if (error) throw error;
}

export async function updateOrgProfile(orgId: string, updates: { name?: string; short_name?: string; settings?: OrgSettings }) {
  const { error } = await supabase.from("organizations").update(updates).eq("id", orgId);
  if (error) throw error;
}

export async function uploadLogo(orgId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${orgId}/logo.${ext}`;
  const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(path);
  const { error: updateError } = await supabase.from("organizations").update({ logo_url: publicUrl }).eq("id", orgId);
  if (updateError) throw updateError;
  return publicUrl;
}

/* ═══════════════════════════════════════════════════════════════
   PARTIES
   ═══════════════════════════════════════════════════════════════ */

export async function fetchParties(orgId: string): Promise<Party[]> {
  const { data, error } = await supabase.from("parties").select("*").eq("org_id", orgId).order("name");
  if (error) throw error;
  return (data as DbParty[]).map(rowToParty);
}

export async function upsertParty(orgId: string, party: Party) {
  const row = partyToRow(party, orgId);
  const { error } = await supabase.from("parties").upsert({ ...row, id: party.id });
  if (error) throw error;
}

export async function deleteParty(id: string) {
  const { error } = await supabase.from("parties").delete().eq("id", id);
  if (error) throw error;
}

/* ═══════════════════════════════════════════════════════════════
   CONTRACTS
   ═══════════════════════════════════════════════════════════════ */

export async function fetchContracts(orgId: string): Promise<Contract[]> {
  const { data, error } = await supabase.from("contracts").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DbContract[]).map(rowToContract);
}

export async function upsertContract(orgId: string, contract: Contract) {
  const row = contractToRow(contract, orgId);
  const { error } = await supabase.from("contracts").upsert({ ...row, id: contract.id });
  if (error) throw error;
}

export async function deleteContract(id: string) {
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) throw error;
}

/* ═══════════════════════════════════════════════════════════════
   DOCUMENTS (with items)
   ═══════════════════════════════════════════════════════════════ */

export async function fetchDocuments(orgId: string): Promise<Doc[]> {
  const { data: docs, error } = await supabase
    .from("documents").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
  if (error) throw error;

  const docIds = (docs ?? []).map((d) => d.id);
  if (docIds.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("document_items").select("*").in("document_id", docIds).order("sort_order");
  if (itemsError) throw itemsError;

  const itemsByDoc = new Map<string, DbDocumentItem[]>();
  for (const it of (items ?? []) as DbDocumentItem[]) {
    const arr = itemsByDoc.get(it.document_id) ?? [];
    arr.push(it);
    itemsByDoc.set(it.document_id, arr);
  }

  return (docs as DbDocument[]).map((d) => rowToDoc(d, itemsByDoc.get(d.id) ?? []));
}

export async function upsertDocument(orgId: string, doc: Doc) {
  const { document: docRow, items: itemRows } = docToRows(doc, orgId);

  const { error: docError } = await supabase.from("documents").upsert({ ...docRow, id: doc.id });
  if (docError) throw docError;

  await supabase.from("document_items").delete().eq("document_id", doc.id);
  if (itemRows.length > 0) {
    const { error: itemsError } = await supabase.from("document_items").insert(itemRows.map((it) => ({ ...it, document_id: doc.id })));
    if (itemsError) throw itemsError;
  }
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

/* ═══════════════════════════════════════════════════════════════
   PAYMENTS
   ═══════════════════════════════════════════════════════════════ */

export async function fetchPayments(orgId: string): Promise<Payment[]> {
  const { data, error } = await supabase.from("payments").select("*").eq("org_id", orgId).order("date", { ascending: false });
  if (error) throw error;
  return (data as DbPayment[]).map(rowToPayment);
}

export async function upsertPayment(orgId: string, payment: Payment) {
  const row = paymentToRow(payment, orgId);
  const { error } = await supabase.from("payments").upsert({ ...row, id: payment.id });
  if (error) throw error;
}

export async function deletePayment(id: string) {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
}

/* ═══════════════════════════════════════════════════════════════
   LETTERS
   ═══════════════════════════════════════════════════════════════ */

export async function fetchLetters(orgId: string): Promise<Letter[]> {
  const { data, error } = await supabase.from("letters").select("*").eq("org_id", orgId).order("date", { ascending: false });
  if (error) throw error;
  return (data as DbLetter[]).map(rowToLetter);
}

export async function upsertLetter(orgId: string, letter: Letter) {
  const row = letterToRow(letter, orgId);
  const { error } = await supabase.from("letters").upsert({ ...row, id: letter.id });
  if (error) throw error;
}

export async function deleteLetter(id: string) {
  const { error } = await supabase.from("letters").delete().eq("id", id);
  if (error) throw error;
}

/* ═══════════════════════════════════════════════════════════════
   FULL STATE (load all at once)
   ═══════════════════════════════════════════════════════════════ */

export async function fetchFullState(orgId: string): Promise<State> {
  const [parties, contracts, docs, payments, letters, own] = await Promise.all([
    fetchParties(orgId),
    fetchContracts(orgId),
    fetchDocuments(orgId),
    fetchPayments(orgId),
    fetchLetters(orgId),
    fetchOrgDetails(orgId),
  ]);
  return { docs, parties, contracts, payments, letters, own };
}

/* ═══════════════════════════════════════════════════════════════
   GROUPS & PERMISSIONS
   ═══════════════════════════════════════════════════════════════ */

export async function fetchGroups(orgId: string): Promise<DbGroup[]> {
  const { data, error } = await supabase.from("groups").select("*").eq("org_id", orgId).order("name");
  if (error) throw error;
  return data as DbGroup[];
}

export async function createGroup(orgId: string, name: string, description: string): Promise<DbGroup> {
  const { data, error } = await supabase.from("groups").insert({ org_id: orgId, name, description }).select().single();
  if (error) throw error;
  return data as DbGroup;
}

export async function updateGroup(id: string, updates: { name?: string; description?: string }) {
  const { error } = await supabase.from("groups").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteGroup(id: string) {
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw error;
}

/* ─── group members ─────────────────────────────────────────── */

export async function fetchGroupMembers(groupId: string): Promise<DbGroupMember[]> {
  const { data, error } = await supabase.from("group_members").select("*").eq("group_id", groupId);
  if (error) throw error;
  return data as DbGroupMember[];
}

export async function addGroupMember(groupId: string, profileId: string) {
  const { error } = await supabase.from("group_members").insert({ group_id: groupId, profile_id: profileId });
  if (error) throw error;
}

export async function removeGroupMember(groupId: string, profileId: string) {
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("profile_id", profileId);
  if (error) throw error;
}

/* ─── permissions ───────────────────────────────────────────── */

export async function fetchPermissions(groupId: string): Promise<DbPermission[]> {
  const { data, error } = await supabase.from("permissions").select("*").eq("group_id", groupId);
  if (error) throw error;
  return data as DbPermission[];
}

export async function savePermission(groupId: string, section: string, perms: Omit<DbPermission, "id" | "group_id" | "section">) {
  const { error } = await supabase.from("permissions").upsert({
    group_id: groupId, section, ...perms,
  }, { onConflict: "group_id,section" });
  if (error) throw error;
}

export async function savePermissionsBatch(groupId: string, perms: { section: string; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean; hidden_fields: string[] }[]) {
  const rows = perms.map((p) => ({ group_id: groupId, ...p }));
  const { error } = await supabase.from("permissions").upsert(rows, { onConflict: "group_id,section" });
  if (error) throw error;
}

/* ─── profiles (for admin user management) ──────────────────── */

export async function fetchOrgProfiles(orgId: string): Promise<DbProfile[]> {
  const { data, error } = await supabase.from("profiles").select("*").eq("org_id", orgId).order("full_name");
  if (error) throw error;
  return data as DbProfile[];
}

export async function updateProfile(id: string, updates: Partial<DbProfile>) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", id);
  if (error) throw error;
}

/* ═══════════════════════════════════════════════════════════════
   DATA MIGRATION (localStorage → Supabase)
   ═══════════════════════════════════════════════════════════════ */

export async function migrateStateToSupabase(orgId: string, state: State) {
  const ops: Promise<unknown>[] = [];

  for (const p of state.parties) ops.push(upsertParty(orgId, p));
  for (const c of state.contracts) ops.push(upsertContract(orgId, c));
  for (const d of state.docs) ops.push(upsertDocument(orgId, d));
  for (const p of state.payments) ops.push(upsertPayment(orgId, p));
  for (const l of state.letters) ops.push(upsertLetter(orgId, l));
  ops.push(saveOrgDetails(orgId, state.own));

  await Promise.all(ops);
}
