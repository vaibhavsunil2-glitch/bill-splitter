"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Item {
  id: number
  name: string
  price: number
  totalQuantity: number
  selectedQuantity: number
  remaining: number
}

interface ItemSelectorProps {
  items: Item[]
  onSelect: (itemId: number, quantity: number) => void
  selectedItems: Array<{ itemId: number; quantity: number }>
}

export default function ItemSelector({ items, onSelect }: ItemSelectorProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{item.name}</p>
            <p className="text-muted-foreground">${item.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              ({item.remaining}/{item.totalQuantity} available)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                onSelect(item.id, Math.max(item.selectedQuantity - 1, 0))
              }
              disabled={item.selectedQuantity === 0}
            >
              -
            </Button>
            <span className="w-4 text-center text-sm font-medium">
              {item.selectedQuantity}
            </span>
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                onSelect(item.id, Math.min(item.selectedQuantity + 1, item.totalQuantity))
              }
              disabled={item.remaining === 0}
            >
              +
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
