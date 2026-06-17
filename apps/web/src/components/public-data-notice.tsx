type Props = {
  title: string;
  body: string;
};

export function PublicDataNotice({ title, body }: Props) {
  return (
    <div
      className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100"
      role="note"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-2 leading-relaxed text-amber-900/90 dark:text-amber-100/90">
        {body}
      </p>
    </div>
  );
}
