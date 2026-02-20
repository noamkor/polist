"use client";

import { signOut, useSession } from "next-auth/react";
import { labels, roleLabels } from "@/lib/utils/hebrew";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/ThemeProvider";

export function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-card border-b border-border px-6 h-16 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{session.user.name}</span>
            <span className="mx-2">|</span>
            <span>{roleLabels[session.user.role] || session.user.role}</span>
          </div>
        )}
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
          {theme === "dark" ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          {labels.logout}
        </Button>
      </div>
    </header>
  );
}
