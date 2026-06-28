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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
        className="flex flex-col gap-4"
      >
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
          <Field
            form={form}
            name="purchaseDate"
            label="Purchase date"
            type="date"
          />

          <Field
            form={form}
            name="purchasePrice"
            label="Purchase price (AUD)"
            type="number"
            placeholder="1999"
          />
          <Field form={form} name="retailer" label="Retailer" placeholder="JB Hi-Fi" />

          <Field
            form={form}
            name="warrantyMonths"
            label="Warranty length (months)"
            type="number"
            placeholder="24"
          />
          <Field
            form={form}
            name="warrantyProvider"
            label="Warranty provider"
            placeholder="AppleCare+"
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional notes…"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
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
