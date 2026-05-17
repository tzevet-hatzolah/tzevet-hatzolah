const BOI_BANK_BRANCHES_XML_URL =
  "https://www.boi.org.il/boi_files/Pikuah/Branches_for_payments.xml";

const BANK_NUMBER_LENGTH = 2;
const BANK_BRANCH_LENGTH = 3;
const BANK_BRANCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const BANK_BRANCH_REVALIDATE_SECONDS = 24 * 60 * 60;
const BANK_BRANCH_FETCH_TIMEOUT_MS = 2500;
const HADOAR_BANK_CODE = "09";
const HADOAR_BRANCH_CODE = "001";
const HADOAR_BANK_NAME = "בנק הדואר";
const HADOAR_BRANCH_NAME = "סניף 001";
const SUPPORTED_DIGITAL_TRANSFER_BANK_CODES = new Set([
  "03", // בנק אש
  "04", // בנק יהב
  HADOAR_BANK_CODE,
  "10", // בנק לאומי
  "11", // בנק דיסקונט
  "12", // בנק הפועלים
  "14", // בנק אוצר החייל
  "17", // בנק מרכנתיל
  "18", // וואן זירו
  "20", // בנק מזרחי טפחות
  "31", // הבנק הבינלאומי
  "46", // בנק מסד
  "52", // בנק פועלי אגודת ישראל
  "54", // בנק ירושלים
]);

type BankBranchRegistry = {
  names: Map<string, string>;
  pairs: Set<string>;
  branchNames: Map<string, string>;
};

export type BankBranchLookup = {
  bankKnown: boolean;
  bankSupported: boolean;
  bankName: string | null;
  branchKnown: boolean | null;
  branchName: string | null;
};

let bankBranchCache: { expiresAt: number; registry: BankBranchRegistry } | null =
  null;

function digitsOnly(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function normalizeBankNumber(bank: string): string | null {
  const bankNumber = Number(bank);
  if (!Number.isInteger(bankNumber) || bankNumber < 1) return null;
  return String(bankNumber).padStart(BANK_NUMBER_LENGTH, "0");
}

function normalizeBranchNumber(branch: string): string | null {
  const branchNumber = Number(branch);
  if (!Number.isInteger(branchNumber) || branchNumber < 1) return null;
  return String(branchNumber).padStart(BANK_BRANCH_LENGTH, "0");
}

function bankBranchKey(bank: string, branch: string): string | null {
  const normalizedBank = normalizeBankNumber(bank);
  const normalizedBranch = normalizeBranchNumber(branch);
  if (!normalizedBank || !normalizedBranch) return null;
  return `${normalizedBank}:${normalizedBranch}`;
}

function tagValue(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1]?.trim() ?? "";
}

function parseOfficialBankBranches(xml: string): BankBranchRegistry {
  const names = new Map<string, string>();
  const pairs = new Set<string>();
  const branchNames = new Map<string, string>();

  for (const match of xml.matchAll(/<branch>([\s\S]*?)<\/branch>/g)) {
    const block = match[1] ?? "";
    if (tagValue(block, "close_date")) continue;

    const bank = digitsOnly(tagValue(block, "id"));
    const branch = digitsOnly(tagValue(block, "branch_code"));
    const bankName = tagValue(block, "name");
    const branchName = tagValue(block, "branch_name");
    const normalizedBank = normalizeBankNumber(bank);
    const key = bankBranchKey(bank, branch);

    if (normalizedBank && bankName) names.set(normalizedBank, bankName);
    if (key) {
      pairs.add(key);
      if (branchName) branchNames.set(key, branchName);
    }
  }

  return { names, pairs, branchNames };
}

export async function getOfficialBankBranchRegistry(): Promise<BankBranchRegistry> {
  const now = Date.now();
  if (bankBranchCache && bankBranchCache.expiresAt > now) {
    return bankBranchCache.registry;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    BANK_BRANCH_FETCH_TIMEOUT_MS
  );

  try {
    const res = await fetch(BOI_BANK_BRANCHES_XML_URL, {
      next: { revalidate: BANK_BRANCH_REVALIDATE_SECONDS },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Bank branch lookup failed with status ${res.status}`);
    }

    const registry = parseOfficialBankBranches(await res.text());
    if (registry.names.size === 0 || registry.pairs.size === 0) {
      throw new Error("Bank branch lookup returned no active branches");
    }

    bankBranchCache = {
      registry,
      expiresAt: now + BANK_BRANCH_CACHE_TTL_MS,
    };
    return registry;
  } finally {
    clearTimeout(timeout);
  }
}

export async function lookupOfficialBankBranch(
  bank: string,
  branch?: string | null
): Promise<BankBranchLookup> {
  const normalizedBank = normalizeBankNumber(bank);
  if (!normalizedBank) {
    return {
      bankKnown: false,
      bankSupported: false,
      bankName: null,
      branchKnown: null,
      branchName: null,
    };
  }

  if (normalizedBank === HADOAR_BANK_CODE) {
    const normalizedBranch =
      branch && branch.length > 0 ? normalizeBranchNumber(branch) : null;
    const branchKnown = normalizedBranch
      ? normalizedBranch === HADOAR_BRANCH_CODE
      : null;

    return {
      bankKnown: true,
      bankSupported: true,
      bankName: HADOAR_BANK_NAME,
      branchKnown,
      branchName: branchKnown ? HADOAR_BRANCH_NAME : null,
    };
  }

  const registry = await getOfficialBankBranchRegistry();
  const bankName = registry.names.get(normalizedBank) ?? null;
  const bankSupported =
    Boolean(bankName) && SUPPORTED_DIGITAL_TRANSFER_BANK_CODES.has(normalizedBank);
  const branchKey =
    branch && branch.length > 0 ? bankBranchKey(bank, branch) : null;

  return {
    bankKnown: Boolean(bankName),
    bankSupported,
    bankName,
    branchKnown: branchKey ? registry.pairs.has(branchKey) : null,
    branchName: branchKey ? registry.branchNames.get(branchKey) ?? null : null,
  };
}
