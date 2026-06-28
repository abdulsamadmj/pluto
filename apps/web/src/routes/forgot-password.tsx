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
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "../components/auth-layout";
import { forgotPasswordSchema } from "../lib/auth-schemas";
import { authClient } from "../utils/auth-client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const form = useForm({
    schema: forgotPasswordSchema,
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // Mocked email flow — the reset link is logged by the server. We always
    // show the same confirmation to avoid leaking which emails exist.
    await authClient.forgetPassword({
      email: values.email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
  });

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send you a link to get back into your account"
      footer={
        <>
          Remembered it?{" "}
          <Link to="/sign-in" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-emerald-300/80">
            If an account exists for that email, we&apos;ve sent a password
            reset link. (This is a demo — the link is printed in the server
            console.)
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="mt-2"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
