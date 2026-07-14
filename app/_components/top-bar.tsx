export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-100 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-2xl items-center px-4 py-3 sm:px-6">
        <a href="/" className="flex items-center gap-1.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white sm:size-8">
            t
          </span>
          <span className="text-lg font-bold tracking-tight text-brand sm:text-xl">
            tokopedia
          </span>
        </a>
      </div>
    </header>
  );
}
