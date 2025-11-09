"use client";

export function SplitResults({ totals }: { totals: Record<string, number> }) {
  return (
    <div className="mt-4 p-4 border rounded bg-white shadow-sm">
      <h3 className="font-semibold mb-3 text-lg">Final Split:</h3>
      <div className="space-y-1">
        {Object.entries(totals).map(([name, amt]) => (
          <div key={name} className="flex justify-between">
            <span>{name}</span>
            <span>₹{amt.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
