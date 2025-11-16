"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string>("");

  const router = useRouter();

  // -------------------------------
  // handle file selection
  // -------------------------------
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  // -------------------------------
  // MAIN UPLOAD HANDLER
  // -------------------------------
  const handleUpload = async () => {
    if (!file) return setError("Please select a file first");

    setLoading(true);
    setError("");
    setStatus("Requesting presigned URL...");

    try {
      // 1️⃣ Request presigned URL
      const presignRes = await fetch("/api/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "image/jpeg",
        }),
      });

      if (!presignRes.ok) throw new Error("Failed to get presigned URL");

      const presignData = await presignRes.json();

      const uploadUrl: string = presignData.uploadUrl;
      const s3Key: string = presignData.key;
      const sessionId: string = presignData.sessionId;

      if (!uploadUrl || !s3Key || !sessionId) {
        throw new Error(
          "Presign API missing key/uploadUrl/sessionId in response"
        );
      }

      // 2️⃣ Upload file to S3
      setStatus("Uploading to S3...");
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      // 3️⃣ Poll Textract Processor Lambda via Next.js API
      setStatus("Processing bill with Textract...");

      let processedBillData = null;

      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 3000)); // wait 3s

        const billRes = await fetch(
          `/api/bill/${encodeURIComponent(s3Key)}`
        );

        if (billRes.ok) {
          processedBillData = await billRes.json();
          break;
        }
      }

      if (!processedBillData) {
        throw new Error("Timed out waiting for bill processing");
      }

      // 4️⃣ Create share session
      setStatus("Creating share link...");

      const shareRes = await fetch("/api/bill/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          billId: s3Key, // S3 key acts as bill ID
          imageUrl: processedBillData.imageUrl || "",
          items: processedBillData.items || [],
          subtotal: processedBillData.subtotal || 0,
          tax: processedBillData.tax || 0,
          total: processedBillData.total || 0,
        }),
      });

      if (!shareRes.ok) throw new Error("Failed to create share session");

      const { publicLink } = await shareRes.json();

      // 5️⃣ Show link & redirect
      alert(
        `✅ Bill processed!\n\nShare this link (valid for 15 minutes):\n${publicLink}`
      );

      router.push(publicLink);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Upload failed: ${msg}`);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  // -------------------------------
  // RENDER UI
  // -------------------------------
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold">Split Your Bill</h1>
        <p className="text-muted-foreground">
          Upload your bill image to extract and split automatically.
        </p>

        {/* Upload Box */}
        <label className="block">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f && f.type.startsWith("image/")) handleFileSelect(f);
            }}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <p className="font-semibold mb-1">Drag or click to upload</p>
            <p className="text-sm text-muted-foreground">Supported: PNG, JPG</p>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
              className="hidden"
            />
          </div>
        </label>

        {preview && (
          <img
            src={preview}
            alt="Bill preview"
            className="rounded-lg border max-h-96 object-contain mx-auto"
          />
        )}

        {status && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="animate-spin w-4 h-4" />
            {status}
          </div>
        )}

        {error && <div className="text-destructive text-sm">{error}</div>}

        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4" />}
          {loading ? "Processing..." : "Upload & Generate Link"}
        </Button>
      </Card>
    </main>
  );
}
