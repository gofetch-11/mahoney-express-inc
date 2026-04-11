import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, PenTool, CheckCircle, X, RotateCcw, Upload } from "lucide-react";

const GREEN = "#0fa14a";
const SURFACE = "#161a1d";
const SURFACE2 = "#1e2328";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#f0f0ee";
const MUTED = "#8a8a85";

export default function PodCaptureModal({ job, onConfirm, onCancel }) {
  const [step, setStep] = useState("photo"); // photo | signature | uploading | done
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [sigDone, setSigDone] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef();
  const drawing = useRef(false);

  // Signature canvas setup
  useEffect(() => {
    if (step !== "signature") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e2328";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [step]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setSigDone(true);
  };

  const stopDraw = (e) => {
    e.preventDefault();
    drawing.current = false;
  };

  const clearSig = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e2328";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSigDone(false);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleConfirm = async () => {
    setStep("uploading");
    setError("");
    try {
      let photoUrl = null;
      let signatureUrl = null;

      // Upload photo
      if (photoFile) {
        const res = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = res.file_url;
      }

      // Upload signature as PNG blob
      if (sigDone && canvasRef.current) {
        const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, "image/png"));
        const sigFile = new File([blob], `signature_${job.id}.png`, { type: "image/png" });
        const res = await base44.integrations.Core.UploadFile({ file: sigFile });
        signatureUrl = res.file_url;
      }

      await onConfirm({ photoUrl, signatureUrl });
    } catch (e) {
      setError("Upload failed: " + e.message);
      setStep("signature");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.6)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "#060204", padding: "16px 20px", borderBottom: `3px solid ${GREEN}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px", fontFamily: "Barlow, sans-serif" }}>Proof of Delivery</p>
            <h2 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: TEXT, margin: 0, fontSize: 16 }}>Job {job.job_number}</h2>
          </div>
          <button onClick={onCancel} style={{ color: MUTED, background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>

        {/* Step tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
          {[{ id: "photo", icon: Camera, label: "Photo" }, { id: "signature", icon: PenTool, label: "Signature" }].map(t => {
            const Icon = t.icon;
            const active = step === t.id;
            const done = (t.id === "photo" && step === "signature") || step === "uploading" || step === "done";
            return (
              <button key={t.id} onClick={() => (step !== "uploading" && step !== "done") && setStep(t.id)}
                style={{ flex: 1, padding: "12px 0", background: active ? SURFACE2 : "transparent", border: "none", borderBottom: active ? `2px solid ${GREEN}` : "2px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: active ? TEXT : MUTED, fontWeight: 700, fontSize: 13, fontFamily: "Barlow, sans-serif" }}>
                <Icon size={14} style={{ color: done ? GREEN : (active ? TEXT : MUTED) }} />
                {t.label}
                {done && <CheckCircle size={12} style={{ color: GREEN }} />}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 20 }}>

          {/* PHOTO STEP */}
          {step === "photo" && (
            <div>
              {photoPreview ? (
                <div style={{ position: "relative", marginBottom: 16 }}>
                  <img src={photoPreview} alt="Package" style={{ width: "100%", borderRadius: 12, maxHeight: 240, objectFit: "cover", border: `1px solid ${BORDER}` }} />
                  <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 20px", borderRadius: 12, border: `2px dashed rgba(15,161,74,0.35)`, cursor: "pointer", background: "rgba(15,161,74,0.04)", marginBottom: 16 }}>
                  <Camera size={32} style={{ color: GREEN, opacity: 0.7 }} />
                  <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 700, color: TEXT, margin: 0, fontSize: 14 }}>Tap to take a photo</p>
                  <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>Photo of delivered package or recipient</p>
                  <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
                </label>
              )}
              <button onClick={() => setStep("signature")}
                style={{ width: "100%", padding: "12px", borderRadius: 12, background: GREEN, color: "#fff", border: "none", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
                {photoPreview ? "Next: Collect Signature →" : "Skip Photo → Signature"}
              </button>
            </div>
          )}

          {/* SIGNATURE STEP */}
          {step === "signature" && (
            <div>
              <p style={{ fontSize: 12, color: MUTED, margin: "0 0 10px" }}>Have the recipient sign below:</p>
              <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, marginBottom: 12 }}>
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={180}
                  style={{ width: "100%", height: 180, display: "block", touchAction: "none", cursor: "crosshair" }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                <button onClick={clearSig} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "4px 10px", color: MUTED, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <RotateCcw size={11} />Clear
                </button>
              </div>
              {!sigDone && <p style={{ fontSize: 11, color: MUTED, textAlign: "center", margin: "0 0 12px" }}>Draw signature above with finger or mouse</p>}
              {error && <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 10px" }}>{error}</p>}
              <button onClick={handleConfirm} disabled={!sigDone && !photoFile}
                style={{ width: "100%", padding: "12px", borderRadius: 12, background: GREEN, color: "#fff", border: "none", fontWeight: 800, fontSize: 14, cursor: (!sigDone && !photoFile) ? "not-allowed" : "pointer", fontFamily: "Barlow, sans-serif", opacity: (!sigDone && !photoFile) ? 0.5 : 1 }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <CheckCircle size={16} />Confirm Delivery
                </span>
              </button>
              {(!sigDone && !photoFile) && (
                <button onClick={() => onConfirm({ photoUrl: null, signatureUrl: null })}
                  style={{ width: "100%", marginTop: 8, padding: "10px", borderRadius: 12, background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Skip & Mark Delivered
                </button>
              )}
            </div>
          )}

          {/* UPLOADING */}
          {step === "uploading" && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid rgba(15,161,74,0.3)`, borderTopColor: GREEN, animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 700, color: TEXT, margin: "0 0 6px" }}>Saving delivery proof…</p>
              <p style={{ color: MUTED, fontSize: 13 }}>Uploading photo and signature</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}