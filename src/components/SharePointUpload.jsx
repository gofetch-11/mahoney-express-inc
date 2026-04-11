import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { uploadToSharePoint } from '@/functions/uploadToSharePoint';

const GREEN = '#0fa14a';
const SURFACE = '#161a1d';
const SURFACE2 = '#1e2328';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = '#f0f0ee';
const MUTED = '#8a8a85';

export default function SharePointUpload({ jobNumber, onUploadSuccess, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus(null);
    const newFiles = [];

    for (const file of files) {
      try {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const base64 = evt.target.result.split(',')[1];
          const response = await uploadToSharePoint({
            fileName: file.name,
            fileBase64: base64,
            jobNumber,
          });

          if (response.success) {
            newFiles.push({ name: file.name, url: response.fileUrl });
            setUploadStatus('success');
            setStatusMessage(`✓ ${file.name} uploaded to SharePoint`);
          } else {
            setUploadStatus('error');
            setStatusMessage(`Failed to upload ${file.name}`);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setUploadStatus('error');
        setStatusMessage(err.message);
      }
    }

    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setUploading(false);
    if (onUploadSuccess) onUploadSuccess(newFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ padding: '14px 16px', background: SURFACE2, borderRadius: 12, border: `1px solid ${BORDER}` }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTED, margin: '0 0 10px', fontFamily: 'Barlow, sans-serif' }}>Upload to SharePoint</p>

      {/* Upload area */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderRadius: 10,
          border: `2px dashed ${GREEN}33`,
          background: `${GREEN}08`,
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          opacity: disabled || uploading ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => !disabled && !uploading && (e.currentTarget.style.background = `${GREEN}15`)}
        onMouseLeave={(e) => !disabled && !uploading && (e.currentTarget.style.background = `${GREEN}08`)}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <>
            <Loader size={16} style={{ color: GREEN, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: GREEN }}>Uploading…</span>
          </>
        ) : (
          <>
            <Upload size={16} style={{ color: GREEN, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Click or drag photos/PDFs</span>
          </>
        )}
      </label>

      {/* Status message */}
      {uploadStatus && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: uploadStatus === 'success' ? 'rgba(15,161,74,0.1)' : 'rgba(239,68,68,0.1)' }}>
          {uploadStatus === 'success' ? (
            <CheckCircle size={14} style={{ color: GREEN, flexShrink: 0, marginTop: 2 }} />
          ) : (
            <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
          )}
          <p style={{ fontSize: 11, color: uploadStatus === 'success' ? GREEN : '#f87171', margin: 0 }}>{statusMessage}</p>
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: '0.06em' }}>Uploaded ({uploadedFiles.length})</p>
          {uploadedFiles.map((file, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', fontSize: 11, color: TEXT }}>
              <CheckCircle size={12} style={{ color: GREEN, flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: GREEN, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{file.name}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}