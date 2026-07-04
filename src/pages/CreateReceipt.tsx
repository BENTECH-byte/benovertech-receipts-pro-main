import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BUSINESS, formatNGN, OPEN_SITE_USER_ID } from "@/lib/business";
import { toast } from "sonner";
import { Receipt } from "@/types/receipt";
import { ArrowLeft, ImagePlus, Loader2, Sparkles } from "lucide-react";

const schema = z.object({
  customer_name: z.string().trim().min(2, "Customer name is required").max(120),
  customer_phone: z.string().trim().min(7, "Phone is required").max(20),
  customer_address: z.string().trim().max(500).optional(),
  product_name: z.string().trim().min(2, "Product name is required").max(160),
  product_color: z.string().trim().max(60).optional(),
  serial_number: z.string().trim().max(120).optional(),
  part_number: z.string().trim().max(120).optional(),
  price: z.number().min(0, "Price must be 0 or more").max(1_000_000_000),
  warranty_note: z.string().trim().min(2).max(300),
});

const empty = {
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  product_name: "",
  product_color: "",
  serial_number: "",
  part_number: "",
  price: "",
  warranty_note: BUSINESS.defaultWarranty,
};

const CreateReceipt = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get("duplicate");

  const [form, setForm] = useState(empty);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!duplicateId) return;
    (async () => {
      const { data, error } = await supabase
        .from("receipts").select("*").eq("id", duplicateId).maybeSingle();
      if (error || !data) return;
      const r = data as Receipt;
      setForm({
        customer_name: r.customer_name,
        customer_phone: r.customer_phone,
        customer_address: r.customer_address ?? "",
        product_name: r.product_name,
        product_color: r.product_color ?? "",
        serial_number: r.serial_number ?? "",
        part_number: r.part_number ?? "",
        price: String(r.price),
        warranty_note: r.warranty_note,
      });
      setExistingImageUrl(r.product_image_url);
      setImagePreview(r.product_image_url);
      toast.success("Previous receipt loaded — edit any field and save.");
    })();
  }, [duplicateId]);

  const update = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleImage = (file: File | null) => {
    setImageFile(file);
    if (!file) {
      setImagePreview(existingImageUrl);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = schema.safeParse({
      ...form,
      customer_address: form.customer_address || undefined,
      product_color: form.product_color || undefined,
      serial_number: form.serial_number || undefined,
      part_number: form.part_number || undefined,
      price: Number(form.price),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const currentUserId = OPEN_SITE_USER_ID;
      if (!currentUserId) {
        throw new Error("Open-site user ID is not configured. Set VITE_SUPABASE_OPEN_USER_ID.");
      }

      // Generate receipt number via secure function
      const { data: rn, error: rnErr } = await supabase.rpc("generate_receipt_number", {
        _user_id: currentUserId,
      });
      if (rnErr || !rn) throw rnErr ?? new Error("Could not generate receipt number");

      // Upload image if provided
      let imageUrl: string | null = existingImageUrl;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${currentUserId}/${rn}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, imageFile, { upsert: true, contentType: imageFile.type });
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }

      const { data: inserted, error: insErr } = await supabase
        .from("receipts")
        .insert({
          user_id: currentUserId,
          receipt_number: rn,
          customer_name: parsed.data.customer_name,
          customer_phone: parsed.data.customer_phone,
          customer_address: parsed.data.customer_address ?? null,
          product_name: parsed.data.product_name,
          product_color: parsed.data.product_color ?? null,
          serial_number: parsed.data.serial_number ?? null,
          part_number: parsed.data.part_number ?? null,
          price: parsed.data.price,
          product_image_url: imageUrl,
          warranty_note: parsed.data.warranty_note,
        })
        .select("id")
        .single();
      if (insErr || !inserted) throw insErr ?? new Error("Could not save receipt");

      toast.success("Receipt issued.");
      navigate(`/receipt/${inserted.id}`);
    } catch (err: any) {
      console.error("Receipt issue failed:", err);
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const priceNumber = Number(form.price) || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="container mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 flex-1">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-4 hover-lift"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </button>

        <div className="flex items-end justify-between flex-wrap gap-4 animate-fade-up mb-8">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">New receipt</div>
            <h1 className="display-font mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
              Issue a <span className="gold-text">premium receipt</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Complete the form below to generate your personalized receipt</p>
          </div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gold flex-shrink-0" /> Auto-generated #
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_320px] animate-fade-up" style={{ animationDelay: "60ms" }}>
          {/* Left: form */}
          <div className="space-y-6 min-w-0">
            <Section title="Customer Information">
              <Field label="Full name">
                <Input 
                  value={form.customer_name} 
                  onChange={(e) => update("customer_name", e.target.value)} 
                  className="input-premium w-full" 
                  placeholder="e.g. Tunde Ade"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone (WhatsApp)">
                  <Input 
                    value={form.customer_phone} 
                    onChange={(e) => update("customer_phone", e.target.value)} 
                    className="input-premium w-full" 
                    placeholder="0801 234 5678"
                    type="tel"
                  />
                </Field>
                <Field label="Address (optional)">
                  <Input 
                    value={form.customer_address} 
                    onChange={(e) => update("customer_address", e.target.value)} 
                    className="input-premium w-full" 
                    placeholder="Lagos"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Product Details">
              <Field label="Product name">
                <Input 
                  value={form.product_name} 
                  onChange={(e) => update("product_name", e.target.value)} 
                  className="input-premium w-full" 
                  placeholder="iPhone 15 Pro Max 256GB"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Colour">
                  <Input 
                    value={form.product_color} 
                    onChange={(e) => update("product_color", e.target.value)} 
                    className="input-premium w-full" 
                    placeholder="Natural Titanium"
                  />
                </Field>
                <Field label="Serial number">
                  <Input 
                    value={form.serial_number} 
                    onChange={(e) => update("serial_number", e.target.value)} 
                    className="input-premium number-mono w-full"
                  />
                </Field>
                <Field label="Part number">
                  <Input 
                    value={form.part_number} 
                    onChange={(e) => update("part_number", e.target.value)} 
                    className="input-premium number-mono w-full"
                  />
                </Field>
              </div>
              <Field label="Price (₦)">
                <Input
                  type="number" 
                  inputMode="decimal" 
                  min={0} 
                  step="0.01"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  className="input-premium number-mono w-full text-lg"
                  placeholder="0.00"
                />
              </Field>
            </Section>

            <Section title="Warranty">
              <Field label="Warranty note">
                <Textarea
                  value={form.warranty_note}
                  onChange={(e) => update("warranty_note", e.target.value)}
                  className="input-premium w-full min-h-[100px]"
                />
              </Field>
            </Section>

            <Section title="Product Image (optional)">
              <label className="block group cursor-pointer">
                <input
                  type="file" 
                  accept="image/*" 
                  className="sr-only"
                  onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-4 sm:p-6 hover:bg-muted/40 transition hover-lift">
                  <div className="h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-muted ring-1 ring-border/60 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Product preview" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{imagePreview ? "Replace image" : "Upload product image"}</div>
                    <div className="text-xs text-muted-foreground mt-1">PNG, JPG, or WEBP · max 5 MB</div>
                  </div>
                </div>
              </label>
            </Section>
          </div>

          {/* Right: summary - Sticky on desktop, fixed on mobile */}
          <aside className="lg:sticky lg:top-24 self-start space-y-4 mt-6 lg:mt-0">
            <div className="glass rounded-2xl p-5 sm:p-6">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Summary</div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-[0.16em]">Customer</div>
                  <div className="text-sm font-semibold truncate text-foreground mt-1">{form.customer_name || "—"}</div>
                  <div className="text-xs text-muted-foreground number-mono truncate">{form.customer_phone || "—"}</div>
                </div>
                <div className="h-px bg-border/60" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-[0.16em]">Product</div>
                  <div className="text-sm font-semibold truncate text-foreground mt-1">{form.product_name || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[form.product_color, form.serial_number].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <div className="h-px bg-border/60" />
                <div className="rounded-xl bg-ink p-4 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-paper/50 font-semibold">Total</span>
                  <span className="number-mono display-font text-2xl font-bold gold-text">{formatNGN(priceNumber)}</span>
                </div>
              </div>
            </div>

            <Button
              type="submit" 
              disabled={submitting}
              className="h-12 w-full rounded-xl bg-gradient-gold text-ink font-semibold hover:opacity-95 shadow-gold transition touch-target"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <>✓ Issue receipt</>
              )}
            </Button>
            <Button
              type="button" 
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="h-11 w-full rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition touch-target"
            >
              Cancel
            </Button>
          </aside>
        </form>
      </main>

      <Footer />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="glass rounded-2xl p-5 sm:p-6 space-y-4 hover-lift">
    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">{title}</div>
    {children}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">{label}</Label>
    {children}
  </div>
);

export default CreateReceipt;
