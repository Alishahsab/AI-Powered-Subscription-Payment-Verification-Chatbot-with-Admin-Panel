type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
};

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="size-11 rounded-xl bg-zinc-100 text-zinc-500 grid place-items-center">{icon}</div>
      <div className="mt-3 font-medium text-[14px] text-zinc-800">{title}</div>
      {description && <div className="text-[12.5px] text-zinc-500 mt-1 max-w-xs">{description}</div>}
    </div>
  );
}
