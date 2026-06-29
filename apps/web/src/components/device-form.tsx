import { Button } from "@repo/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@repo/ui/form";
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Textarea } from "@repo/ui/textarea";
import { toast } from "@repo/ui/toast";
import {
  createDeviceSchema,
  deviceCategories,
  type ScanExtraction,
} from "@repo/validators";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileUp, Loader2, Paperclip, ScanLine } from "lucide-react";
import { useRef, useState } from "react";
import { scanWarrantyCard, uploadDocument } from "../queries/devices.queries";

/** The form's input shape (strings from inputs; zod coerces on submit). */
export type DeviceFormValues = {
  name: string;
  brand: string;
  category: string;
  model: string;
  serialNumber: string;
  purchaseDate: string; // yyyy-mm-dd
  purchasePrice: number | string;
  retailer: string;
  warrantyMonths: number | string;
  warrantyProvider: string;
  notes: string;
  // R2 object key of a scanned card image, set when added via the scan flow.
  warrantyCardKey?: string;
};

/** Converts an ISO date (or Date) to the yyyy-mm-dd value an <input type="date"> wants. */
export function toDateInput(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

export const emptyDeviceForm = (): DeviceFormValues => ({
  name: "",
  brand: "",
  category: "",
  model: "",
  serialNumber: "",
  purchaseDate: toDateInput(new Date()),
  purchasePrice: "",
  retailer: "",
  warrantyMonths: 12,
  warrantyProvider: "Manufacturer Warranty",
  notes: "",
  warrantyCardKey: undefined,
});

/**
 * Folds OCR-extracted fields onto the empty form. Only fields the model could
 * read overwrite the defaults; nulls are ignored. Dates/numbers are coerced to
 * the string shapes the inputs expect.
 */
export function mergeExtracted(extracted: ScanExtraction): DeviceFormValues {
  const base = emptyDeviceForm();
  const set = <K extends keyof DeviceFormValues>(
    key: K,
    value: DeviceFormValues[K] | null | undefined
  ) => {
    if (value !== null && value !== undefined && value !== "") base[key] = value;
  };
  set("name", extracted.name);
  set("brand", extracted.brand);
  set("category", extracted.category);
  set("model", extracted.model);
  set("serialNumber", extracted.serialNumber);
  if (extracted.purchaseDate) base.purchaseDate = toDateInput(extracted.purchaseDate);
  if (extracted.purchasePrice != null) base.purchasePrice = extracted.purchasePrice;
  set("retailer", extracted.retailer);
  if (extracted.warrantyMonths != null) base.warrantyMonths = extracted.warrantyMonths;
  set("warrantyProvider", extracted.warrantyProvider);
  return base;
}

type StepName = "Scan" | "Details" | "Warranty" | "Documents";

/** Fields validated before advancing past each step. */
const STEP_FIELDS: Record<StepName, (keyof DeviceFormValues)[]> = {
  Scan: [],
  Details: ["name", "brand", "category", "model", "serialNumber"],
  Warranty: ["purchaseDate", "purchasePrice", "retailer", "warrantyMonths", "warrantyProvider", "notes"],
  Documents: [],
};

export function DeviceForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  onCancel,
  showScan = true,
}: {
  defaultValues: DeviceFormValues;
  onSubmit: (values: ReturnType<typeof createDeviceSchema.parse>) => void;
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  /** Show the camera/OCR scan step first. Off for the edit form. */
  showScan?: boolean;
}) {
  const form = useForm({
    schema: createDeviceSchema,
    // The schema's input type is loose (coerced fields); our string/number
    // defaults satisfy it at runtime.
    defaultValues: defaultValues as never,
  });
  const steps: StepName[] = showScan
    ? ["Scan", "Details", "Warranty", "Documents"]
    : ["Details", "Warranty", "Documents"];
  const [step, setStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const current = steps[step];
  const attachedKey = form.watch("warrantyCardKey");

  const goNext = async () => {
    const ok = await form.trigger(STEP_FIELDS[current] as never);
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleScanFile = async (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    setScanning(true);
    try {
      const { key, extracted } = await scanWarrantyCard(file);
      // Prefill detected fields; keep the rest for the user. Stash the R2 key
      // so it's submitted with the device.
      form.reset({ ...mergeExtracted(extracted), warrantyCardKey: key } as never);
      const found = Object.values(extracted).filter(
        (v) => v !== null && v !== undefined
      ).length;
      toast.success(
        found > 0
          ? `Scanned — prefilled ${found} field${found === 1 ? "" : "s"}. Review the rest.`
          : "Image saved. We couldn't read any fields — fill them in manually."
      );
      // Advance to the first non-scan step.
      setStep(1);
    } catch {
      toast.error("Couldn't scan that image. Try again or enter details manually.");
    } finally {
      setScanning(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { key } = await uploadDocument(file);
      form.setValue("warrantyCardKey", key);
      // Only images have a useful inline preview; PDFs just show as attached.
      setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
      toast.success("Document attached");
    } catch {
      toast.error("Couldn't attach that file. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          // A stray Enter / keyboard "Go" in any field submits the whole form.
          // Only create the device on the final step; otherwise advance, so the
          // user can't skip the remaining steps (e.g. Documents) by accident.
          if (step < steps.length - 1) {
            setStep((s) => Math.min(s + 1, steps.length - 1));
            return;
          }
          onSubmit(values);
        })}
        className="flex flex-col gap-5"
      >
        <Stepper steps={steps} step={step} />

        <div className="min-h-[18rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {current === "Scan" && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-10 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleScanFile(file);
                      e.target.value = ""; // allow re-selecting the same file
                    }}
                  />
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Warranty card preview"
                      className="max-h-40 rounded-lg border border-white/10 object-contain"
                    />
                  ) : (
                    <div className="grid size-12 place-items-center rounded-full bg-primary/10">
                      <ScanLine className="size-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-zinc-200">Scan a warranty card or receipt</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      We&apos;ll read the details and fill the form for you. You can
                      edit everything before saving.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={scanning}
                  >
                    {scanning && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    {scanning ? "Scanning…" : "Take or upload a photo"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={scanning}
                    className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline disabled:opacity-50"
                  >
                    Skip — enter manually
                  </button>
                </div>
              )}

              {current === "Details" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field form={form} name="name" label="Device name" placeholder="MacBook Pro 16&quot;" />
                  <Field form={form} name="brand" label="Brand" placeholder="Apple" />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {deviceCategories.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Field form={form} name="model" label="Model" placeholder="A2780" />
                  <Field form={form} name="serialNumber" label="Serial number" placeholder="C02XXXXXXXXX" />
                </div>
              )}

              {current === "Warranty" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field form={form} name="purchaseDate" label="Purchase date" type="date" />
                  <Field form={form} name="purchasePrice" label="Purchase price (USD)" type="number" placeholder="1999" />
                  <Field form={form} name="retailer" label="Retailer" placeholder="JB Hi-Fi" />
                  <Field form={form} name="warrantyMonths" label="Warranty length (months)" type="number" placeholder="24" />
                  <Field form={form} name="warrantyProvider" label="Warranty provider" placeholder="AppleCare+" />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Optional notes…" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {current === "Documents" && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-10 text-center">
                  <input
                    ref={docInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUploadFile(file);
                      e.target.value = ""; // allow re-selecting the same file
                    }}
                  />
                  {attachedKey ? (
                    <>
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Attached document"
                          className="max-h-40 rounded-lg border border-white/10 object-contain"
                        />
                      ) : (
                        <div className="grid size-12 place-items-center rounded-full bg-primary/10">
                          <Paperclip className="size-6 text-primary" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <Check className="size-4" /> Document attached
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => docInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? <Loader2 className="size-4 animate-spin" /> : null}
                        {uploading ? "Uploading…" : "Replace document"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="grid size-12 place-items-center rounded-full bg-white/5">
                        <FileUp className="size-6 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-200">Attach a document</p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Receipt or warranty card — image or PDF. Optional.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => docInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <FileUp className="size-4" />
                        )}
                        {uploading ? "Uploading…" : "Choose file"}
                      </Button>
                    </>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={isSubmitting}>
              Back
            </Button>
          ) : onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : (
            <span />
          )}

          {current === "Scan" ? (
            // The scan card drives advancing (scan result or "Skip"), so no
            // bottom Next here — just the Cancel control on the left.
            <span />
          ) : step < steps.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              <Check className="size-4" />
              {isSubmitting ? "Saving…" : submitLabel}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

function Stepper({ steps, step }: { steps: StepName[]; step: number }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/20 text-primary"
                    : "bg-white/5 text-zinc-500"
              }`}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </div>
            <span className={`text-xs ${active ? "text-zinc-100" : "text-zinc-500"}`}>{label}</span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

/** Small wrapper for a plain text/number/date field bound to RHF. */
function Field({
  form,
  name,
  label,
  type = "text",
  placeholder,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  name: keyof DeviceFormValues;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }: { field: object }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
