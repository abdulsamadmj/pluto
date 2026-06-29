import {
  createDeviceSchema,
  deviceCategories,
  type ScanExtraction,
} from "@repo/validators";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Check,
  FileUp,
  Image as ImageIcon,
  Paperclip,
  ScanLine,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { scanWarrantyCard, uploadDocument } from "../lib/scan";
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
  // R2 object key of a scanned card image, set when added via the scan flow.
  warrantyCardKey?: string;
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
    warrantyCardKey: undefined,
  };
}

/**
 * Folds OCR-extracted fields onto the empty form. Only fields the model could
 * read overwrite the defaults; nulls are ignored. Numbers/dates are stringified
 * to match the mobile form's all-string value shape.
 */
export function mergeExtracted(extracted: ScanExtraction): DeviceFormValues {
  const base = emptyDeviceForm();
  if (extracted.name) base.name = extracted.name;
  if (extracted.brand) base.brand = extracted.brand;
  if (extracted.category) base.category = extracted.category;
  if (extracted.model) base.model = extracted.model;
  if (extracted.serialNumber) base.serialNumber = extracted.serialNumber;
  if (extracted.purchaseDate) base.purchaseDate = toDateInput(extracted.purchaseDate);
  if (extracted.purchasePrice != null) base.purchasePrice = String(extracted.purchasePrice);
  if (extracted.retailer) base.retailer = extracted.retailer;
  if (extracted.warrantyMonths != null) base.warrantyMonths = String(extracted.warrantyMonths);
  if (extracted.warrantyProvider) base.warrantyProvider = extracted.warrantyProvider;
  return base;
}

type StepName = "Scan" | "Details" | "Warranty" | "Documents";

const STEP_FIELDS: Record<StepName, (keyof DeviceFormValues)[]> = {
  Scan: [],
  Details: ["name", "brand", "category", "model", "serialNumber"],
  Warranty: ["purchaseDate", "purchasePrice", "retailer", "warrantyMonths", "warrantyProvider", "notes"],
  Documents: [],
};

export function DeviceForm({
  initial,
  submitLabel,
  loading,
  onSubmit,
  showScan = true,
}: {
  initial: DeviceFormValues;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (values: ReturnType<typeof createDeviceSchema.parse>) => void;
  /** Show the camera/OCR scan step first. Off for the edit form. */
  showScan?: boolean;
}) {
  const [values, setValues] = useState<DeviceFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const steps: StepName[] = showScan
    ? ["Scan", "Details", "Warranty", "Documents"]
    : ["Details", "Warranty", "Documents"];
  const [step, setStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const current = steps[step];

  const set = (key: keyof DeviceFormValues, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  // Validate only the current step's fields before advancing.
  const validateStep = (name: StepName) => {
    const fields = STEP_FIELDS[name];
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
    if (validateStep(current)) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const runScan = async (asset: ImagePicker.ImagePickerAsset) => {
    setPreviewUri(asset.uri);
    setScanning(true);
    try {
      const { key, extracted } = await scanWarrantyCard({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      // Prefill detected fields; keep the rest for the user. Stash the R2 key.
      setValues({ ...mergeExtracted(extracted), warrantyCardKey: key });
      const found = Object.values(extracted).filter(
        (v) => v !== null && v !== undefined
      ).length;
      Alert.alert(
        "Scan complete",
        found > 0
          ? `Prefilled ${found} field${found === 1 ? "" : "s"}. Review the rest before saving.`
          : "Image saved, but we couldn't read any fields. Please fill them in."
      );
      setStep(1); // advance to the first non-scan step
    } catch {
      Alert.alert("Scan failed", "Couldn't read that image. Try again or enter details manually.");
    } finally {
      setScanning(false);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera access needed", "Enable camera access to scan a card.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) void runScan(result.assets[0]);
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) void runScan(result.assets[0]);
  };

  // Documents step: attach an image to R2 without OCR.
  const attachDocument = async (asset: ImagePicker.ImagePickerAsset) => {
    setPreviewUri(asset.uri);
    setUploading(true);
    try {
      const { key } = await uploadDocument({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      setValues((prev) => ({ ...prev, warrantyCardKey: key }));
      Alert.alert("Attached", "Document attached to this device.");
    } catch {
      Alert.alert("Upload failed", "Couldn't attach that file. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const attachFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera access needed", "Enable camera access to attach a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) void attachDocument(result.assets[0]);
  };

  const attachFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) void attachDocument(result.assets[0]);
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
          const owner = steps.findIndex((s) =>
            STEP_FIELDS[s].includes(k as keyof DeviceFormValues)
          );
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
      <Stepper steps={steps} step={step} />

      <Animated.View key={step} entering={FadeIn.duration(220)} className="gap-4">
        {current === "Scan" && (
          <View className="items-center gap-4 rounded-2xl border border-dashed border-border bg-white/[0.02] py-8">
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                className="h-36 w-48 rounded-xl"
                resizeMode="contain"
              />
            ) : (
              <View className="size-12 items-center justify-center rounded-full bg-primary/10">
                <ScanLine size={22} color="#00DE6F" />
              </View>
            )}
            <View className="items-center px-8">
              <Text className="text-base font-medium text-zinc-200">
                Scan a warranty card or receipt
              </Text>
              <Text className="mt-1 text-center text-sm text-muted">
                We&apos;ll read the details and fill the form for you. You can edit
                everything before saving.
              </Text>
            </View>
            <View className="w-full gap-2 px-6">
              <Button onPress={pickFromCamera} loading={scanning}>
                <View className="flex-row items-center gap-2">
                  <Camera size={18} color="#181818" />
                  <Text className="text-base font-semibold text-zinc-950">
                    {scanning ? "Scanning…" : "Take a photo"}
                  </Text>
                </View>
              </Button>
              <Button variant="outline" onPress={pickFromLibrary} disabled={scanning}>
                <View className="flex-row items-center gap-2">
                  <ImageIcon size={18} color="#e4e4e7" />
                  <Text className="text-base font-semibold text-zinc-100">
                    Choose from library
                  </Text>
                </View>
              </Button>
              <Button variant="ghost" onPress={() => setStep(1)} disabled={scanning}>
                Skip — enter manually
              </Button>
            </View>
          </View>
        )}

        {current === "Details" && (
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

        {current === "Warranty" && (
          <>
            <Field label="Purchase date (YYYY-MM-DD)" error={errors.purchaseDate}>
              <Input value={values.purchaseDate} onChangeText={(v) => set("purchaseDate", v)} placeholder="2025-01-15" />
            </Field>
            <Field label="Purchase price (USD)" error={errors.purchasePrice}>
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

        {current === "Documents" && (
          <View className="items-center gap-4 rounded-2xl border border-dashed border-border bg-white/[0.02] py-8">
            {values.warrantyCardKey ? (
              <>
                {previewUri ? (
                  <Image
                    source={{ uri: previewUri }}
                    className="h-36 w-48 rounded-xl"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="size-12 items-center justify-center rounded-full bg-primary/10">
                    <Paperclip size={22} color="#00DE6F" />
                  </View>
                )}
                <View className="flex-row items-center gap-1.5">
                  <Check size={16} color="#34d399" />
                  <Text className="text-sm text-emerald-400">Document attached</Text>
                </View>
              </>
            ) : (
              <>
                <View className="size-12 items-center justify-center rounded-full bg-white/5">
                  <FileUp size={22} color="#a1a1aa" />
                </View>
                <View className="items-center px-8">
                  <Text className="text-base font-medium text-zinc-200">Attach a document</Text>
                  <Text className="mt-1 text-center text-sm text-muted">
                    Receipt or warranty card photo. Optional.
                  </Text>
                </View>
              </>
            )}
            <View className="w-full gap-2 px-6">
              <Button onPress={attachFromCamera} loading={uploading}>
                <View className="flex-row items-center gap-2">
                  <Camera size={18} color="#181818" />
                  <Text className="text-base font-semibold text-zinc-950">
                    {values.warrantyCardKey ? "Replace with photo" : "Take a photo"}
                  </Text>
                </View>
              </Button>
              <Button variant="outline" onPress={attachFromLibrary} disabled={uploading}>
                <View className="flex-row items-center gap-2">
                  <ImageIcon size={18} color="#e4e4e7" />
                  <Text className="text-base font-semibold text-zinc-100">
                    Choose from library
                  </Text>
                </View>
              </Button>
            </View>
          </View>
        )}

      </Animated.View>

      {current !== "Scan" && (
        <View className="flex-row gap-3 pt-2">
          {step > 0 && (
            <View className="flex-1">
              <Button variant="outline" onPress={() => setStep((s) => s - 1)}>
                Back
              </Button>
            </View>
          )}
          <View className="flex-1">
            {step < steps.length - 1 ? (
              <Button onPress={goNext}>Next</Button>
            ) : (
              <Button onPress={submit} loading={loading}>
                {submitLabel}
              </Button>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function Stepper({ steps, step }: { steps: StepName[]; step: number }) {
  return (
    <View className="flex-row items-center gap-2 pb-1">
      {steps.map((label, i) => {
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
            {i < steps.length - 1 && <View className="h-px flex-1 bg-white/10" />}
          </View>
        );
      })}
    </View>
  );
}
