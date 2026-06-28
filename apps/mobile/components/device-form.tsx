import { createDeviceSchema, deviceCategories } from "@repo/validators";
import { Check, FileUp } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
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

const STEPS = ["Details", "Warranty", "Documents"] as const;
const STEP_FIELDS: (keyof DeviceFormValues)[][] = [
  ["name", "brand", "category", "model", "serialNumber"],
  ["purchaseDate", "purchasePrice", "retailer", "warrantyMonths", "warrantyProvider", "notes"],
  [],
];

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
  const [step, setStep] = useState(0);

  const set = (key: keyof DeviceFormValues, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  // Validate only the current step's fields before advancing.
  const validateStep = (index: number) => {
    const fields = STEP_FIELDS[index];
    if (fields.length === 0) return true;
    const shape = Object.fromEntries(fields.map((f) => [f, true]));
    const parsed = createDeviceSchema
      .pick(shape as never)
      .safeParse(values);
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const map: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string" && !map[k]) map[k] = issue.message;
    }
    setErrors(map);
    return false;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = () => {
    const parsed = createDeviceSchema.safeParse(values);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      let firstStep = step;
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string" && !map[k]) {
          map[k] = issue.message;
          const owner = STEP_FIELDS.findIndex((fs) => fs.includes(k as keyof DeviceFormValues));
          if (owner >= 0) firstStep = Math.min(firstStep, owner);
        }
      }
      setErrors(map);
      setStep(firstStep);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  };

  return (
    <View className="gap-4 pb-8">
      <Stepper step={step} />

      <Animated.View key={step} entering={FadeIn.duration(220)} className="gap-4">
        {step === 0 && (
          <>
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
          </>
        )}

        {step === 1 && (
          <>
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
          </>
        )}

        {step === 2 && (
          <View className="items-center gap-3 rounded-2xl border border-dashed border-border bg-white/[0.02] py-12">
            <View className="size-12 items-center justify-center rounded-full bg-white/5">
              <FileUp size={22} color="#a1a1aa" />
            </View>
            <Text className="text-base font-medium text-zinc-200">Attach documents</Text>
            <Text className="px-8 text-center text-sm text-muted">
              Receipts & warranty cards — you'll be able to upload these soon.
            </Text>
            <View className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
              <Text className="text-xs uppercase tracking-wide text-primary">Coming soon</Text>
            </View>
          </View>
        )}
      </Animated.View>

      <View className="flex-row gap-3 pt-2">
        {step > 0 && (
          <View className="flex-1">
            <Button variant="outline" onPress={() => setStep((s) => s - 1)}>
              Back
            </Button>
          </View>
        )}
        <View className="flex-1">
          {step < STEPS.length - 1 ? (
            <Button onPress={goNext}>Next</Button>
          ) : (
            <Button onPress={submit} loading={loading}>
              {`Skip & ${submitLabel.toLowerCase()}`}
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <View className="flex-row items-center gap-2 pb-1">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <View key={label} className="flex-1 flex-row items-center gap-2">
            <View
              className={`size-6 items-center justify-center rounded-full ${
                active ? "bg-primary" : done ? "bg-primary/20" : "bg-white/5"
              }`}
            >
              {done ? (
                <Check size={14} color="#00DE6F" />
              ) : (
                <Text className={`text-xs font-semibold ${active ? "text-zinc-950" : "text-muted"}`}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text className={`text-xs ${active ? "text-zinc-100" : "text-muted"}`} numberOfLines={1}>
              {label}
            </Text>
            {i < STEPS.length - 1 && <View className="h-px flex-1 bg-white/10" />}
          </View>
        );
      })}
    </View>
  );
}
