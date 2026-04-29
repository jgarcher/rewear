type EmptyShellProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function EmptyShell({ eyebrow, title, description }: EmptyShellProps) {
  return (
    <main className="flex-1 px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
          {title}
        </h1>

        <div className="mt-12 rounded-2xl border border-linen-200 bg-linen-50 p-10 text-center">
          <p className="text-base leading-relaxed text-charcoal-soft sm:text-lg">
            {description}
          </p>
        </div>
      </div>
    </main>
  );
}
