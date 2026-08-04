import Topbar from "./Topbar";

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {actions && <div className="mb-4 flex flex-wrap justify-end gap-2">{actions}</div>}
        {children}
      </main>
    </>
  );
}
