import LogoutButton from "./LogoutButton";

export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-koura-text">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">Admin User</p>
          <p className="text-xs text-slate-500">Municipal Staff</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-koura-primary/10 text-sm font-semibold text-koura-primary">
          AU
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
