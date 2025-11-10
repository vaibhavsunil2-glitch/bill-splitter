"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import UploadPage from "@/components/upload-page"
import BillViewPage from "@/components/bill-view-page"

export default function Home() {
  const router = useRouter()
  const [billData, setBillData] = useState(null)
  const [billId, setBillId] = useState(null)

  const handleUploadComplete = (data: any) => {
    setBillData(data)
    setBillId(data.billId)
  }

  const handleBackToUpload = () => {
    setBillData(null)
    setBillId(null)
  }

  if (billData) {
    router.push(`?billId=${billId}`)
    return <BillViewPage />
  }

  return <UploadPage onUploadComplete={handleUploadComplete} />
}
