import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Camera, X, CheckCircle, AlertCircle } from "lucide-react";

const CONNECTOR_ID = "69d76809d5359a26fa536917"; // SharePoint User connector

export default function ProofOfDeliveryUpload({ job, onSuccess, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef();
  const cameraRef = useRef();

  const uploadFile = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      // Check if user is authenticated
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        setError("Not authenticated. Please log in.");
        setUploading(false);
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result.split(",")[1];
          
          // Call backend function to upload to SharePoint
          const response = await base44.functions.invoke("uploadToSharePoint", {
            fileName: file.name,
            fileBase64: base64,
            jobNumber: job.job_number,
            connectorId: CONNECTOR_ID,
          });

          if (response.success) {
            setSuccess(true);
            onSuccess?.(response.fileUrl);
            setTimeout(() => {
              setUploading(false);
              onClose?.();
            }, 1500);
          } else {
            throw new Error(response.error || "Upload failed");
          }
        } catch (err) {
          setError(err.message || "Upload error");
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message || "Upload failed");
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
          maxWidth: 300,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}>
          <CheckCircle size={48} style={{ color: "#0fa14a", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: "#060204", margin: "0 0 8px" }}>Upload Successful</p>
          <p style={{ fontSize: 13, color: "#6b6b67", margin: 0 }}>File uploaded to SharePoint</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: 16,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: 24,
        maxWidth: 400,
        width: "100%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#060204", margin: 0 }}>Upload Proof of Delivery</h3>
          <button onClick={onClose} style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#999",
            fontSize: 20,
          }}>✕</button>
        </div>

        {error && (
          <div style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            display: "flex",
            gap: 10,
          }}>
            <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#991b1b", margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {/* Camera button */}
          <button
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
            style={{
              padding: 16,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "#f4f4f2",
              cursor: uploading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontWeight: 600,
              fontSize: 13,
              color: "#060204",
              opacity: uploading ? 0.5 : 1,
            }}>
            <Camera size={16} />
            Snap Photo
          </button>

          {/* File upload button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              padding: 16,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "#f4f4f2",
              cursor: uploading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontWeight: 600,
              fontSize: 13,
              color: "#060204",
              opacity: uploading ? 0.5 : 1,
            }}>
            <Upload size={16} />
            Choose File
          </button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => uploadFile(e.target.files?.[0])}
          disabled={uploading}
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          style={{ display: "none" }}
          onChange={(e) => uploadFile(e.target.files?.[0])}
          disabled={uploading}
        />

        {uploading && (
          <div style={{
            textAlign: "center",
            padding: 20,
            borderTop: "1px solid rgba(0,0,0,0.08)",
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid #0fa14a",
              borderTopColor: "transparent",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px",
            }} />
            <p style={{ fontSize: 13, color: "#6b6b67", margin: 0 }}>Uploading to SharePoint…</p>
          </div>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}