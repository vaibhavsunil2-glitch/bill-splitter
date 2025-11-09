"use client"

import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useEffect, useState } from "react"

interface BillImageProps {
  imageUrl?: string
}

export default function BillImage({ imageUrl }: BillImageProps) {
  const [validImage, setValidImage] = useState<string | null>(null)

  useEffect(() => {
    if (!imageUrl) return
    // validate the URL
    try {
      const url = new URL(imageUrl)
      setValidImage(url.toString())
    } catch {
      // if it's not a valid URL, maybe it's a relative S3 key
      setValidImage(`/api/images/${imageUrl}`)
    }
  }, [imageUrl])

  return (
    <Card className="p-4 bg-muted/50">
      <h2 className="text-lg font-semibold text-foreground mb-4">Bill Image</h2>
      <div className="rounded-lg overflow-hidden bg-background border border-border flex items-center justify-center">
        {validImage ? (
          <Image
            src={validImage}
            alt="Bill"
            width={600}
            height={400}
            className="w-full h-auto max-h-96 object-contain"
            unoptimized
          />
        ) : (
          <div className="text-sm text-muted-foreground py-20">No image uploaded</div>
        )}
      </div>
    </Card>
  )
}
