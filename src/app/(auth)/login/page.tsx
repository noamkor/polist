"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { labels } from "@/lib/utils/hebrew";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(labels.loginError);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-background dark:to-background">
      <div className="w-full max-w-md mx-4">
        <div className="bg-card rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-700 mb-2">
              {labels.appName}
            </h1>
            <p className="text-muted-foreground">ניהול לקוחות ופוליסות ביטוח</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-1"
              >
                {labels.username}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-lg border border-input-border bg-card text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-start"
                dir="ltr"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1"
              >
                {labels.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-input-border bg-card text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-start"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-danger-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? labels.loading : labels.loginButton}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
