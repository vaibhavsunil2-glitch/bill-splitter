"use client";

import { useEffect, useState } from "react";

export default function Page({ params }: { params: { shareId: string } }) {
  const { shareId } = params;

  const [bill, setBill] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/join/${shareId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load bill");
        } else {
          setBill(data);
        }
      } catch (e) {
        setError("Network error while fetching bill");
      }
    }

    load();
  }, [shareId]);

  if (error) return <div className="p-8 text-red-600 text-xl">{error}</div>;
  if (!bill) return <div className="p-8 text-lg">Loading shared bill…</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Shared Bill</h1>
      <pre className="p-4 bg-gray-100 rounded-lg border">
        {JSON.stringify(bill, null, 2)}
      </pre>
    </div>
  );
}
