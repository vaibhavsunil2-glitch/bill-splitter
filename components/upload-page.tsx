"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
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

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

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
      const uploadUrl = presignData.uploadUrl;
      if (!uploadUrl) throw new Error("Presigned URL missing from response");

      // 2️⃣ Upload file directly to S3
      setStatus("Uploading to S3...");
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      // 3️⃣ Poll backend for Textract results
      setStatus("Processing bill with Textract...");
      let billData = null;
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const billRes = await fetch(`/api/bill/${encodeURIComponent(file.name)}`);
        if (billRes.ok) {
          billData = await billRes.json();
          break;
        }
      }

      if (!billData) throw new Error("Timed out waiting for Textract output.");

      // 4️⃣ Create shareable session
      setStatus("Creating session...");
      const sessionId = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

      const sessionRes = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          billId: file.name,
          imageUrl: billData.imageUrl || "",
          createdAt: now.toISOString(),
          expiresAt,
        }),
      });

      if (!sessionRes.ok) throw new Error("Failed to create session");

      // 5️⃣ Navigate to Bill Breakdown
      const shareLink = `${window.location.origin}/session/${sessionId}`;
      alert(`✅ Bill ready!\nShare this link (valid for 15 minutes):\n\n${shareLink}`);

      router.push(`/bill-view?billId=${encodeURIComponent(file.name)}`);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Upload failed: ${msg}`);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold">Split Your Bill</h1>
        <p className="text-muted-foreground">
          Upload your bill image to extract and split automatically.
        </p>

        {/* Upload area */}
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
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>
        </label>

        {/* Preview */}
        {preview && (
          <img
            src={preview}
            alt="Bill preview"
            className="rounded-lg border max-h-96 object-contain mx-auto"
          />
        )}

        {/* Loading / Error / Status */}
        {status && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="animate-spin w-4 h-4" />
            {status}
          </div>
        )}

        {error && <div className="text-destructive text-sm">{error}</div>}

        {/* Action Button */}
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
