import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, X } from "lucide-react";

const JobMessage = base44.entities.JobMessage;

const GREEN = "#0fa14a";
const SURFACE = "#161a1d";
const SURFACE2 = "#1e2328";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#f0f0ee";
const MUTED = "#8a8a85";

export default function JobMessaging({ job, driver, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [job.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    const msgs = await JobMessage.filter({ job_id: job.id });
    setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    setLoading(false);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    setSending(true);
    await JobMessage.create({
      job_id: job.id,
      driver_id: driver.id,
      sender_role: "dispatcher",
      sender_name: "Dispatcher",
      message: newMessage,
      read_by_driver: false,
    });
    setNewMessage("");
    setSending(false);
    await loadMessages();
  }

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: GREEN, fontFamily: "Barlow, sans-serif", margin: "0 0 2px" }}>Messaging</p>
            <h3 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: TEXT, margin: 0, fontSize: 15 }}>Job {job.job_number}</h3>
            <p style={{ fontSize: 11, color: MUTED, margin: "2px 0 0" }}>{driver.first_name} {driver.last_name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? (
            <p style={{ color: MUTED, textAlign: "center", fontSize: 12 }}>Loading messages…</p>
          ) : messages.length === 0 ? (
            <p style={{ color: MUTED, textAlign: "center", fontSize: 12, marginTop: "auto", marginBottom: "auto" }}>No messages yet. Send an instruction below.</p>
          ) : (
            messages.map((msg, i) => {
              const isDispatcher = msg.sender_role === "dispatcher";
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: isDispatcher ? "flex-end" : "flex-start", marginBottom: 4 }}>
                  <div style={{ maxWidth: "75%", background: isDispatcher ? GREEN : SURFACE2, border: isDispatcher ? "none" : `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 14px" }}>
                    <p style={{ color: isDispatcher ? "#fff" : TEXT, fontSize: 13, margin: "0 0 4px", lineHeight: 1.4 }}>{msg.message}</p>
                    <p style={{ fontSize: 10, color: isDispatcher ? "rgba(255,255,255,0.6)" : MUTED, margin: 0 }}>{formatTime(msg.created_date)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}`, background: SURFACE2, display: "flex", gap: 8, flexShrink: 0 }}>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type instruction…"
            style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, color: TEXT, padding: "10px 12px", fontSize: 13, outline: "none" }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: GREEN, border: "none", cursor: "pointer", opacity: (sending || !newMessage.trim()) ? 0.5 : 1, color: "#fff" }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}