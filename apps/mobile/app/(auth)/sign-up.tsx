import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { Button, Field, Input } from "../../components/ui";
import { authClient } from "../../lib/auth-client";

const logo = require("../../assets/images/logo.png");

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!name || !email || password.length < 8) {
      setError("Enter a name, email, and a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Could not create account");
      return;
    }
    router.replace("/(tabs)/dashboard");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg"
    >
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="flex-row items-center gap-2.5">
          <Image source={logo} className="size-8 rounded-lg" />
          <Text className="text-lg font-bold text-zinc-50">Pluto</Text>
        </View>
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-50">Create account</Text>
          <Text className="text-muted">Start tracking your devices</Text>
        </View>

        {error ? (
          <Text className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </Text>
        ) : null}

        <View className="gap-4">
          <Field label="Full name">
            <Input value={name} onChangeText={setName} placeholder="Jane Doe" />
          </Field>
          <Field label="Email">
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Field>
          <Field label="Password">
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
            />
          </Field>
          <Button onPress={onSubmit} loading={loading}>
            Create account
          </Button>
        </View>

        <Text className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/(auth)/sign-in" className="font-medium text-primary">
            Sign in
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
