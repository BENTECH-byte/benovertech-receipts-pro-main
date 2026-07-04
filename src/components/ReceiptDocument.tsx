import { forwardRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import { BUSINESS, formatDate, formatNGN, whatsappLinkForBusiness } from "@/lib/business";
import { Receipt } from "@/types/receipt";

type Props = { receipt: Receipt };

/**
 * Premium Apple-style printable receipt.
 * Always rendered on white "paper" so PDF export looks identical on dark or light dashboards.
 */
export const ReceiptDocument = forwardRef<HTMLDivElement, Props>(({ receipt }, ref) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(whatsappLinkForBusiness(`Hi BENOVERTECH, regarding receipt ${receipt.receipt_number}`), {
      margin: 1,
      width: 240,
      color: { dark: "#0a0a0a", light: "#ffffff00" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [receipt.receipt_number]);

  return (
    <div
      ref={ref}
      className="receipt-paper mx-auto w-full max-w-[720px] overflow-hidden transition"
      style={{ borderRadius: 28 }}
    >
      {/* Top scalloped band */}
      <div className="receipt-edge-top h-3 bg-ink" />

      {/* Header */}
      <div className="bg-ink px-6 sm:px-8 pt-6 sm:pt-7 pb-8 text-paper relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, hsl(38 92% 60%) 0%, transparent 50%), radial-gradient(circle at 10% 90%, hsl(268 70% 60%) 0%, transparent 55%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 flex-shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-gradient-gold" />
                <div className="absolute inset-[2px] rounded-[14px] bg-ink flex items-center justify-center">
                  <span className="text-gold font-black text-base display-font">B</span>
                </div>
              </div>
              <div className="leading-none">
                <div className="text-[11px] font-bold tracking-[0.22em] text-paper">BENOVERTECH</div>
                <div className="text-[9px] font-medium tracking-[0.36em] text-paper/60 mt-1">GADGETS · LAGOS</div>
              </div>
            </div>
            <h1 className="display-font mt-6 text-2xl sm:text-[34px] font-semibold leading-[1.05] text-paper">
              Sales Receipt
            </h1>
            <p className="mt-1 text-[13px] text-paper/60">Thank you for your purchase.</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-paper/50">Receipt</div>
            <div className="number-mono mt-1 text-[15px] font-semibold text-gold">
              {receipt.receipt_number}
            </div>
            <div className="mt-3 text-[10px] uppercase tracking-[0.22em] text-paper/50">Issued</div>
            <div className="number-mono mt-1 text-[12px] text-paper/85">
              {formatDate(receipt.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 sm:px-8 pt-7 pb-6 bg-paper">
        {/* Customer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50">Billed to</div>
            <div className="mt-2 text-[15px] font-semibold text-ink">{receipt.customer_name}</div>
            <div className="number-mono mt-1 text-[12.5px] text-ink/70">{receipt.customer_phone}</div>
            {receipt.customer_address && (
              <div className="mt-1 text-[12.5px] text-ink/70 leading-relaxed">{receipt.customer_address}</div>
            )}
          </div>
          <div className="sm:text-right">
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50">Sold by</div>
            <div className="mt-2 text-[15px] font-semibold text-ink">{BUSINESS.name}</div>
            <div className="mt-1 text-[12.5px] text-ink/70 leading-relaxed">{BUSINESS.address}</div>
            <div className="number-mono mt-1 text-[12.5px] text-ink/70">{BUSINESS.phone}</div>
          </div>
        </div>

        <div className="my-6 receipt-divider" />

        {/* Product */}
        <div className="flex flex-col sm:flex-row gap-5">
          {receipt.product_image_url ? (
            <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-paper-2 ring-1 ring-paper-line">
              <img
                src={receipt.product_image_url}
                alt={receipt.product_name}
                className="h-full w-full object-cover transition"
                crossOrigin="anonymous"
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          ) : (
            <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-2xl bg-paper-2 ring-1 ring-paper-line flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-[0.22em] text-ink/40">No image</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50">Product</div>
            <div className="mt-1 text-[18px] font-semibold text-ink leading-tight">{receipt.product_name}</div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
              {receipt.product_color && (
                <>
                  <span className="text-ink/50">Colour</span>
                  <span className="text-ink/85 text-right">{receipt.product_color}</span>
                </>
              )}
              {receipt.serial_number && (
                <>
                  <span className="text-ink/50">Serial No.</span>
                  <span className="number-mono text-ink/85 text-right break-all">{receipt.serial_number}</span>
                </>
              )}
              {receipt.part_number && (
                <>
                  <span className="text-ink/50">Part No.</span>
                  <span className="number-mono text-ink/85 text-right break-all">{receipt.part_number}</span>
                </>
              )}
              <span className="text-ink/50">Quantity</span>
              <span className="number-mono text-ink/85 text-right">1</span>
            </div>
          </div>
        </div>

        <div className="my-6 receipt-divider" />

        {/* Pricing */}
        <div className="space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-ink/60">Subtotal</span>
            <span className="number-mono text-ink/85">{formatNGN(receipt.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">Discount</span>
            <span className="number-mono text-ink/85">{formatNGN(0)}</span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-ink px-5 py-4 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-paper/50">Total Paid</div>
            <div className="text-[10px] text-paper/40 mt-0.5">Includes all applicable charges</div>
          </div>
          <div className="number-mono display-font text-2xl sm:text-[24px] font-bold gold-text">
            {formatNGN(receipt.price)}
          </div>
        </div>

        {/* Warranty */}
        <div className="mt-6 flex gap-4 rounded-2xl bg-purple/10 ring-1 ring-purple/20 px-5 py-4">
          <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-purple flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-paper" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-purple">Warranty</div>
            <div className="mt-0.5 text-[13px] text-ink/85">{receipt.warranty_note}</div>
          </div>
        </div>

        {/* Contact + QR */}
        <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 rounded-2xl bg-paper-2 px-5 py-4 ring-1 ring-paper-line">
          {qrDataUrl && (
            <img 
              src={qrDataUrl} 
              alt="WhatsApp QR" 
              className="h-20 w-20 rounded-xl bg-paper p-1.5 ring-1 ring-paper-line flex-shrink-0" 
              loading="lazy"
            />
          )}
          <div className="min-w-0 text-center sm:text-left">
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink/50">Stay in touch</div>
            <div className="mt-1 text-[13px] font-semibold text-ink">Scan to chat on WhatsApp</div>
            <div className="number-mono mt-0.5 text-[12px] text-ink/70 truncate">{BUSINESS.phone} · {BUSINESS.email}</div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-ink/45">
          This receipt is computer generated and valid without a signature.
        </p>
      </div>

      {/* Bottom scalloped band */}
      <div className="receipt-edge-bottom h-3 bg-ink" />
    </div>
  );
});

ReceiptDocument.displayName = "ReceiptDocument";
