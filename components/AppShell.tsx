type AppShellProps = {
  children: React.ReactNode;
  step?: "create" | "review";
};

export function AppShell({ children, step = "create" }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line/70 bg-panel/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-ocean text-sm font-bold text-white shadow-float">
              H5I
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">
                H5P AI Studio
              </p>
              <p className="text-xs text-muted">Content to interactive quizzes</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className={`step-pill ${step === "create" ? "step-pill-active" : ""}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Create
            </span>
            <span className={`step-pill ${step === "review" ? "step-pill-active" : ""}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Review & export
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <footer className="border-t border-line/70 py-6 text-center text-sm text-muted">
        Built by{" "}
        <a
          className="font-medium text-ocean transition hover:text-ocean-dark"
          href="https://margish-patel.vercel.app"
          target="_blank"
          rel="noreferrer"
        >
          Margish
        </a>
      </footer>
    </div>
  );
}
