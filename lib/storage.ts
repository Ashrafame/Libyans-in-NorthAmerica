import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type TableName =
  | "members"
  | "children"
  | "admins"
  | "posts"
  | "events"
  | "proposals"
  | "proposal_comments"
  | "donations"
  | "fund_reports"
  | "committee"
  | "inbox"
  | "audit_logs"
  | "settings"
  | "volunteer_questions";

export interface Storage {
  mode: "demo" | "supabase";
  all<T>(table: TableName): Promise<T[]>;
  find<T>(table: TableName, id: string): Promise<T | null>;
  insert<T extends { id: string }>(table: TableName, row: T): Promise<T>;
  update<T>(table: TableName, id: string, patch: Partial<T>): Promise<T>;
  remove(table: TableName, id: string): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Local JSON storage — used when Supabase credentials are absent.     */
/* ------------------------------------------------------------------ */

type DemoDatabase = Record<string, unknown[]>;

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

let cache: DemoDatabase | null = null;
let writeQueue: Promise<unknown> = Promise.resolve();

async function readDemo(): Promise<DemoDatabase> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    cache = JSON.parse(raw) as DemoDatabase;
  } catch {
    cache = {};
  }
  return cache;
}

async function writeDemo(db: DemoDatabase) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, DATA_FILE);
  });
  await writeQueue;
}

function rows(db: DemoDatabase, table: string): Record<string, unknown>[] {
  if (!db[table]) db[table] = [];
  return db[table] as Record<string, unknown>[];
}

const demoStorage: Storage = {
  mode: "demo",
  async all<T>(table: TableName) {
    const db = await readDemo();
    return rows(db, table) as T[];
  },
  async find<T>(table: TableName, id: string) {
    const db = await readDemo();
    return (rows(db, table).find((r) => r.id === id) as T) ?? null;
  },
  async insert<T extends { id: string }>(table: TableName, row: T) {
    const db = await readDemo();
    rows(db, table).push({ ...row });
    await writeDemo(db);
    return row;
  },
  async update<T>(table: TableName, id: string, patch: Partial<T>) {
    const db = await readDemo();
    const list = rows(db, table);
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) throw new Error(`Row ${id} not found in ${table}`);
    list[index] = { ...list[index], ...(patch as Record<string, unknown>) };
    await writeDemo(db);
    return list[index] as T;
  },
  async remove(table: TableName, id: string) {
    const db = await readDemo();
    const list = rows(db, table);
    const index = list.findIndex((r) => r.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      await writeDemo(db);
    }
  },
};

/* ------------------------------------------------------------------ */
/* Supabase storage — uses the secret key, server-side only.           */
/* ------------------------------------------------------------------ */

const camelToSnake = (value: string) => value.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const snakeToCamel = (value: string) => value.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function toSnake<T>(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) out[camelToSnake(key)] = value;
  return out;
}

function toCamel<T>(input: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) out[snakeToCamel(key)] = value;
  return out as T;
}

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase credentials are missing");
  supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseAdmin;
}

const supabaseStorage: Storage = {
  mode: "supabase",
  async all<T>(table: TableName) {
    const { data, error } = await getSupabaseAdmin().from(table).select("*");
    if (error) throw new Error(`Supabase read failed (${table}): ${error.message}`);
    return (data ?? []).map((row) => toCamel<T>(row as Record<string, unknown>));
  },
  async find<T>(table: TableName, id: string) {
    const { data, error } = await getSupabaseAdmin().from(table).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase read failed (${table}): ${error.message}`);
    return data ? toCamel<T>(data as Record<string, unknown>) : null;
  },
  async insert<T extends { id: string }>(table: TableName, row: T) {
    const { data, error } = await getSupabaseAdmin()
      .from(table)
      .insert(toSnake(row as Record<string, unknown>))
      .select("*")
      .single();
    if (error) throw new Error(`Supabase insert failed (${table}): ${error.message}`);
    return toCamel<T>(data as Record<string, unknown>);
  },
  async update<T>(table: TableName, id: string, patch: Partial<T>) {
    const { data, error } = await getSupabaseAdmin()
      .from(table)
      .update(toSnake(patch as Record<string, unknown>))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`Supabase update failed (${table}): ${error.message}`);
    return toCamel<T>(data as Record<string, unknown>);
  },
  async remove(table: TableName, id: string) {
    const { error } = await getSupabaseAdmin().from(table).delete().eq("id", id);
    if (error) throw new Error(`Supabase delete failed (${table}): ${error.message}`);
  },
};

/** Writes a freshly built database to disk (demo mode only). */
export async function seedLocalDatabase(db: DemoDatabase) {
  cache = db;
  await writeDemo(db);
}

export function hasSupabase(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_SECRET_KEY ??
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.SUPABASE_SERVICE_KEY),
  );
}

export const storage: Storage = hasSupabase() ? supabaseStorage : demoStorage;
export const isDemoMode = !hasSupabase();
