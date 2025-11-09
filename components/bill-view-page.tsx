"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "./ui/card";
import MemberSetup from "./member-setup";
import MemberItemAllocation from "./member-item-allocation";
import { SplitResults } from "./split-results";

interface BillItem {
  id: number;
  name: string;
  price: number;
  selectedQuantity: number;
  itemTotal: number;
}

export default function BillViewPage() {
  const params = useSearchParams();
  const billId = params.get("billId");
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"members" | "allocation" | "results">("members");
  const [members, setMembers] = useState<string[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!billId) return;

    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/bill/${billId}`);
        if (!res.ok) throw new Error("Bill not found");
        const data = await res.json();

        console.log("Fetched bill data:", data);

        // ✅ Normalize numeric data
        const normalizeNumber = (val: any): number => {
          if (val == null) return 0;
          if (typeof val === "number") return val;
          if (typeof val === "string") {
            const cleaned = val.replace(/[^\d.]/g, ""); // remove ₹, commas, spaces
            return parseFloat(cleaned) || 0;
          }
          return 0;
        };

        const normalizedItems = (data.items || []).map((item: any, index: number) => {
          const price = normalizeNumber(item.price);
          const qty = normalizeNumber(item.quantity || item.selectedQuantity || 1);
          const total = normalizeNumber(item.itemTotal || price * qty);

          return {
            id: item.id ?? index,
            name: item.name ?? `Item ${index + 1}`,
            price,
            selectedQuantity: qty,
            itemTotal: total,
          };
        });

        setBill({
          ...data,
          items: normalizedItems,
        });
      } catch (err) {
        console.error("Error fetching bill:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [billId]);

  // 🧮 FIXED: Proper split logic for shared items
  const handleAllocationComplete = (allocations: Record<string, number[]>) => {
    const totals: Record<string, number> = {};

    // Initialize each member total
    members.forEach((m) => (totals[m] = 0));

    // Loop through each item and split based on number of members sharing it
    bill.items.forEach((item: BillItem) => {
      const sharedBy = members.filter((m) => allocations[m]?.includes(item.id));
      const shareCount = sharedBy.length || 1;
      const itemShare = Number(item.itemTotal ?? item.price ?? 0) / shareCount;

      sharedBy.forEach((m) => {
        totals[m] += itemShare;
      });
    });

    console.log("✅ Calculated Totals:", totals);
    setTotals(totals);
    setStep("results");
  };

  // 🕓 Loading State
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-lg">
        Loading bill details...
      </div>
    );

  // ❌ Bill not found
  if (!bill)
    return (
      <div className="text-center mt-10 text-red-500 text-lg">
        ❌ Bill not found. Please re-upload.
      </div>
    );

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Bill Breakdown</h1>
          <img
            src={bill.imageUrl}
            alt="Bill Image"
            className="rounded-md border max-h-80 object-contain"
          />
        </Card>

        {/* Step 1: Add Members */}
        {step === "members" && (
          <MemberSetup
            onMembersReady={(names) => {
              setMembers(names);
              setStep("allocation");
            }}
            onCancel={() => window.history.back()}
          />
        )}

        {/* Step 2: Allocate Items */}
        {step === "allocation" && (
          <MemberItemAllocation
            members={members}
            items={bill.items}
            onAllocationComplete={handleAllocationComplete}
            onBack={() => setStep("members")}
          />
        )}

        {/* Step 3: Results */}
        {step === "results" && <SplitResults totals={totals} />}
      </div>
    </main>
  );
}
