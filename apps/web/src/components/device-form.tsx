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
import { createDeviceSchema, deviceCategories } from "@repo/validators";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileUp } from "lucide-react";
import { useState } from "react";

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
});

const STEPS = ["Details", "Warranty", "Documents"] as const;
const STEP_FIELDS: (keyof DeviceFormValues)[][] = [
  ["name", "brand", "category", "model", "serialNumber"],
  ["purchaseDate", "purchasePrice", "retailer", "warrantyMonths", "warrantyProvider", "notes"],
  [],
];

export function DeviceForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  onCancel,
}: {
  defaultValues: DeviceFormValues;
  onSubmit: (values: ReturnType<typeof createDeviceSchema.parse>) => void;
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
}) {
  const form = useForm({
    schema: createDeviceSchema,
    // The schema's input type is loose (coerced fields); our string/number
    // defaults satisfy it at runtime.
    defaultValues: defaultValues as never,
  });
  const [step, setStep] = useState(0);

  const goNext = async () => {
    const ok = await form.trigger(STEP_FIELDS[step] as never);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
        className="flex flex-col gap-5"
      >
        <Stepper step={step} />

        <div className="min-h-[18rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
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

              {step === 1 && (
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

              {step === 2 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-14 text-center">
                  <div className="grid size-12 place-items-center rounded-full bg-white/5">
                    <FileUp className="size-6 text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-200">Attach documents</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Receipts &amp; warranty cards — you&apos;ll be able to upload these soon.
                    </p>
                  </div>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-wide text-primary">
                    Coming soon
                  </span>
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

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              <Check className="size-4" />
              {isSubmitting ? "Saving…" : `Skip & ${submitLabel.toLowerCase()}`}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => {
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
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-white/10" />}
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
