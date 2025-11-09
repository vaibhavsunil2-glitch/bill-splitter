"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface BillItem {
  id: number;
  name: string;
  price: number;
  selectedQuantity: number;
  itemTotal: number;
}

interface MemberItemAllocationProps {
  members: string[];
  items: BillItem[];
  onAllocationComplete: (allocation: Record<string, number[]>) => void;
  onBack: () => void;
}

export default function MemberItemAllocation({
  members,
  items,
  onAllocationComplete,
  onBack,
}: MemberItemAllocationProps) {
  const [allocation, setAllocation] = useState<Record<string, number[]>>(() => {
    const init: Record<string, number[]> = {};
    members.forEach((member) => {
      init[member] = [];
    });
    return init;
  });

  // ✅ SAFELY calculate member totals
  const memberTotals = useMemo(() => {
  const totals: Record<string, number> = {};

  members.forEach((member) => {
    let subtotal = 0;

    items.forEach((item) => {
      // Find who all share this item
      const sharedMembers = members.filter((m) =>
        allocation[m].includes(item.id)
      );

      if (allocation[member].includes(item.id)) {
        const share =
          Number(item.itemTotal ?? item.price ?? 0) /
          (sharedMembers.length || 1);
        subtotal += share;
      }
    });

    totals[member] = subtotal;
  });

  return totals;
}, [allocation, members, items]);


  const handleItemToggle = (member: string, itemId: number) => {
    setAllocation((prev) => ({
      ...prev,
      [member]: prev[member].includes(itemId)
        ? prev[member].filter((id) => id !== itemId)
        : [...prev[member], itemId],
    }));
  };

  const handleContinue = () => {
    onAllocationComplete(allocation);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={onBack} className="mb-4 bg-transparent">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold">Allocate Items to Members</h1>
          <p className="text-muted-foreground mt-2">
            Check the boxes to assign items to each person
          </p>
        </div>

        {/* Table Container */}
        <Card className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left font-bold bg-muted/50 sticky left-0 z-10 min-w-40">
                  Member
                </th>
                {items.map((item) => {
                  const itemValue = Number(item.itemTotal ?? item.price ?? 0);
                  return (
                    <th
                      key={item.id}
                      className="p-4 text-center font-semibold bg-muted/50 border-l border-border min-w-32"
                    >
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        x{item.selectedQuantity}
                      </div>
                      <div className="text-xs font-semibold text-primary">
                        ₹{itemValue.toFixed(2)}
                      </div>
                    </th>
                  );
                })}
                <th className="p-4 text-right font-bold bg-muted/50 border-l border-border sticky right-0 z-10 min-w-28">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, memberIdx) => (
                <tr
                  key={member}
                  className={memberIdx % 2 === 0 ? "bg-background" : "bg-muted/30"}
                >
                  <td className="p-4 font-semibold text-foreground sticky left-0 z-10 bg-inherit">
                    {member}
                  </td>
                  {items.map((item) => (
                    <td
                      key={`${member}-${item.id}`}
                      className="p-4 text-center border-l border-border"
                    >
                      <div className="flex justify-center">
                        <Checkbox
                          checked={allocation[member].includes(item.id)}
                          onCheckedChange={() => handleItemToggle(member, item.id)}
                          aria-label={`${member} - ${item.name}`}
                        />
                      </div>
                    </td>
                  ))}
                  <td className="p-4 text-right font-bold text-primary border-l border-border sticky right-0 z-10 bg-inherit">
                    ₹{Number(memberTotals[member] ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Footer */}
        <div className="mt-8 flex gap-2 justify-center">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={handleContinue} size="lg">
            Continue to Results
          </Button>
        </div>
      </div>
    </div>
  );
}
