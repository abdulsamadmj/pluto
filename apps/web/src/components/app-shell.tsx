import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/alert-dialog";
import { Button } from "@repo/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { authClient, useSession } from "../utils/auth-client";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: session } = useSession();

  const signOut = async () => {
    await authClient.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
              🛡️
            </span>
            <span className="text-lg tracking-tight">Warrantly</span>
          </Link>
          <div className="flex items-center gap-3">
            {session?.user && (
              <span className="hidden text-sm text-zinc-400 sm:inline">
                {session.user.name || session.user.email}
              </span>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Sign out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You&apos;ll need to sign in again to access your dashboard.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={signOut}>Sign out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
