interface WidgetCardProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export default function WidgetCard({ title, icon, children, className = '', headerRight }: WidgetCardProps) {
  return (
    <div className={`bg-surface-800 rounded-xl border border-white/5 overflow-hidden flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        {headerRight}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  );
}
