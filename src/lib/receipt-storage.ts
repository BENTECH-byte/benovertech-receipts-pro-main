import type { Receipt } from "@/types/receipt";

const STORAGE_KEY = "benovertech-receipts-local";

export function getLocalReceipts(): Receipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Receipt[];
  } catch {
    return [];
  }
}

export function getLocalReceipt(id: string): Receipt | null {
  return getLocalReceipts().find((receipt) => receipt.id === id) ?? null;
}

export function saveLocalReceipt(receipt: Receipt): Receipt {
  const receipts = getLocalReceipts();
  const existingIndex = receipts.findIndex((item) => item.id === receipt.id);
  if (existingIndex >= 0) {
    receipts[existingIndex] = receipt;
  } else {
    receipts.unshift(receipt);
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  }
  return receipt;
}
