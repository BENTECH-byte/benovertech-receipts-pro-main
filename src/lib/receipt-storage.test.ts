import { beforeEach, describe, expect, it } from "vitest";
import { getLocalReceipt, getLocalReceipts, saveLocalReceipt } from "./receipt-storage";

describe("receipt storage fallback", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores a receipt locally and retrieves it by id", () => {
    const receipt = saveLocalReceipt({
      id: "local-1",
      user_id: "user-1",
      receipt_number: "BNV-2026-07-0001",
      customer_name: "Ada",
      customer_phone: "08012345678",
      customer_address: null,
      product_name: "Phone",
      product_color: null,
      serial_number: null,
      part_number: null,
      price: 1000,
      product_image_url: null,
      pdf_url: null,
      warranty_note: "7-day service warranty",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    expect(receipt.id).toBe("local-1");
    expect(getLocalReceipt("local-1")?.customer_name).toBe("Ada");
    expect(getLocalReceipts()).toHaveLength(1);
  });
});
