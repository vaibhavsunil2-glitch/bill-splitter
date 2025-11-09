"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SelectedItem {
  id: number
  name: string
  price: number
  selectedQuantity: number
  itemTotal: number
}

interface SplitCalculatorProps {
  selectedItems: SelectedItem[]
  subtotal: number
  tax: number
  total: number
  taxPercentage: number
  onShowResults?: () => void
}

export default function SplitCalculator({
  selectedItems,
  subtotal = 0,
  tax = 0,
  total = 0,
  taxPercentage = 0,
  onShowResults,
}: SplitCalculatorProps) {
  const handleGenerateSplit = () => {
    const text = `
BILL SPLIT RECEIPT
==================
${selectedItems.map((item) => `${item.name} x${item.selectedQuantity}: $${item.itemTotal.toFixed(2)}`).join("\n")}
------------------
Subtotal: $${subtotal.toFixed(2)}
Tax (${taxPercentage}%): $${tax.toFixed(2)}
TOTAL: $${total.toFixed(2)}
`
    const el = document.createElement("a")
    el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text))
    el.setAttribute("download", "bill-split.txt")
    el.click()
  }

  return (
    <Card className="p-6 sticky top-4">
      <h2 className="text-xl font-bold text-foreground mb-6">Your Total</h2>

      <div className="space-y-4 mb-6">
        {selectedItems.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Items:</p>
            {selectedItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.name} x{item.selectedQuantity}
                </span>
                <span className="font-semibold">${item.itemTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax ({taxPercentage}%)</span>
            <span className="font-semibold">${tax.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex justify-between items-center">
          <span className="text-lg font-bold">Total</span>
          <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {onShowResults && (
          <Button onClick={onShowResults} className="w-full" size="lg">
            Split With Friends
          </Button>
        )}
        <Button onClick={handleGenerateSplit} disabled={!selectedItems.length} className="w-full" size="lg">
          {selectedItems.length ? "Generate Receipt" : "Select items to continue"}
        </Button>
      </div>
    </Card>
  )
}
