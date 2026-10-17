type CardProps = {
  className?: string;
  children: React.ReactNode;
};

export function Card({ className = "", children }: CardProps) {
  return <div className={`bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>{children}</div>;
}

type CardHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
      <div>
        <div className="font-semibold text-[14.5px] text-zinc-900">{title}</div>
        {description && <div className="text-[12.5px] text-zinc-500 mt-0.5">{description}</div>}
      </div>
      {action}
    </div>
  );
}
