import { Card, CardContent } from "../ui/card";

export function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</p>
        <strong className="mt-3 block text-4xl font-semibold">{value}</strong>
      </CardContent>
    </Card>
  );
}

export function MetricTile({
  label,
  value,
  small = false
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-stone-50/90 p-4">
      <span className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</span>
      <strong className={`mt-2 block font-semibold ${small ? "text-sm leading-6" : "text-2xl"}`}>
        {value}
      </strong>
    </div>
  );
}
