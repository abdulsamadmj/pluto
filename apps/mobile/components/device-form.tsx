import { createDeviceSchema, deviceCategories } from "@repo/validators";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button, Field, Input } from "./ui";

// NOTE: DeviceForm renders a plain View — the parent supplies the scroll
// container (ScrollView on the edit screen, BottomSheetScrollView in the
// create sheet) so gestures behave correctly in each context.

export type DeviceFormValues = {
  name: string;
  brand: string;
  category: string;
  model: string;
  serialNumber: string;
  purchaseDate: string; // yyyy-mm-dd
  purchasePrice: string;
  retailer: string;
  warrantyMonths: string;
  warrantyProvider: string;
  notes: string;
};

export function toDateInput(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function emptyDeviceForm(): DeviceFormValues {
  return {
    name: "",
    brand: "",
    category: "",
    model: "",
    serialNumber: "",
    purchaseDate: toDateInput(new Date()),
    purchasePrice: "",
    retailer: "",
    warrantyMonths: "12",
    warrantyProvider: "Manufacturer Warranty",
    notes: "",
  };
}

export function DeviceForm({
  initial,
  submitLabel,
  loading,
  onSubmit,
}: {
  initial: DeviceFormValues;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (values: ReturnType<typeof createDeviceSchema.parse>) => void;
}) {
  const [values, setValues] = useState<DeviceFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof DeviceFormValues, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const submit = () => {
    const parsed = createDeviceSchema.safeParse(values);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string" && !map[k]) map[k] = issue.message;
      }
      setErrors(map);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  };

  return (
    <View className="gap-4 pb-8">
      <Field label="Device name" error={errors.name}>
        <Input value={values.name} onChangeText={(v) => set("name", v)} placeholder='MacBook Pro 16"' />
      </Field>
      <Field label="Brand" error={errors.brand}>
        <Input value={values.brand} onChangeText={(v) => set("brand", v)} placeholder="Apple" />
      </Field>

      <Field label="Category" error={errors.category}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {deviceCategories.map((c) => {
            const active = values.category === c;
            return (
              <Pressable
                key={c}
                onPress={() => set("category", c)}
                className={`rounded-full border px-3 py-1.5 ${active ? "border-primary bg-primary/20" : "border-border bg-transparent"}`}
              >
                <Text className={active ? "text-sm text-primary" : "text-sm text-muted"}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Field>

      <Field label="Model" error={errors.model}>
        <Input value={values.model} onChangeText={(v) => set("model", v)} placeholder="A2780" />
      </Field>
      <Field label="Serial number" error={errors.serialNumber}>
        <Input value={values.serialNumber} onChangeText={(v) => set("serialNumber", v)} autoCapitalize="characters" />
      </Field>
      <Field label="Purchase date (YYYY-MM-DD)" error={errors.purchaseDate}>
        <Input value={values.purchaseDate} onChangeText={(v) => set("purchaseDate", v)} placeholder="2025-01-15" />
      </Field>
      <Field label="Purchase price (AUD)" error={errors.purchasePrice}>
        <Input value={values.purchasePrice} onChangeText={(v) => set("purchasePrice", v)} keyboardType="numeric" placeholder="1999" />
      </Field>
      <Field label="Retailer" error={errors.retailer}>
        <Input value={values.retailer} onChangeText={(v) => set("retailer", v)} placeholder="JB Hi-Fi" />
      </Field>
      <Field label="Warranty length (months)" error={errors.warrantyMonths}>
        <Input value={values.warrantyMonths} onChangeText={(v) => set("warrantyMonths", v)} keyboardType="numeric" placeholder="24" />
      </Field>
      <Field label="Warranty provider" error={errors.warrantyProvider}>
        <Input value={values.warrantyProvider} onChangeText={(v) => set("warrantyProvider", v)} placeholder="AppleCare+" />
      </Field>
      <Field label="Notes">
        <Input value={values.notes} onChangeText={(v) => set("notes", v)} placeholder="Optional notes…" multiline className="h-24 py-3" />
      </Field>

      <View className="pt-2">
        <Button onPress={submit} loading={loading}>
          {submitLabel}
        </Button>
      </View>
    </View>
  );
}
