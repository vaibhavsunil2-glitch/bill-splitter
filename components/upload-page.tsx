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
      // 1) Get presigned URL
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
      const s3Key = presignData.key;
      const sessionId = presignData.sessionId;

      if (!uploadUrl || !s3Key || !sessionId) {
        throw new Error("Presign API missing key, uploadUrl, or sessionId");
      }

      // 2) Upload file to S3
      setStatus("Uploading to S3...");
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      // 3) Poll bill processor
      setStatus("Processing bill...");
      let processedBillData = null;

      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000));

        const billRes = await fetch(`/api/bill/${encodeURIComponent(s3Key)}`);

        if (billRes.ok) {
          processedBillData = await billRes.json();
          break;
        }else {
           console.log(`Attempt ${i + 1}/20: Still processing...`);
        }
   }
      if (!processedBillData) {
        throw new Error("Timed out waiting for bill processing");
      }

      // 4) Create share session
      setStatus("Creating share link...");

      const shareRes = await fetch("/api/bill/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, // only required field
        }),
      });

      if (!shareRes.ok) {
        throw new Error("Failed to create share session");
      }

      const { publicLink } = await shareRes.json();

      alert(
        `✅ Bill processed!\n\nShare this link (valid for 15 mins):\n${publicLink}`
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

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold">Split Your Bill</h1>
        <p className="text-muted-foreground">
          Upload your bill image to extract and split automatically.
        </p>

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
