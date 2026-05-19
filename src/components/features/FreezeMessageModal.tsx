import { useState } from "react";
import { X, Snowflake, Power, Send, SkipForward } from "lucide-react";

interface Props {
  accountName: string;
  action: "freeze" | "inactive";
  currentMessage?: string;
  onConfirm: (message: string) => void;
  onClose: () => void;
}

export default function FreezeMessageModal({ accountName, action, currentMessage, onConfirm, onClose }: Props) {
  const [message, setMessage] = useState(currentMessage || "");

  const isFreezeAction = action === "freeze";
  const accentColor = isFreezeAction ? "#60a5fa" : "#fb923c";
  const accentBg = isFreezeAction ? "rgba(59,130,246,0.1)" : "rgba(251,146,60,0.1)";
  const accentBorder = isFreezeAction ? "rgba(59,130,246,0.25)" : "rgba(251,146,60,0.25)";
  const label = isFreezeAction ? "Freeze Account" : "Set Inactive";
  const Icon = isFreezeAction ? Snowflake : Power;
  const placeholder = isFreezeAction
    ? "e.g. Your account has been suspended due to a compliance review. Please contact our team for assistance."
    : "e.g. This account has been temporarily restricted pending account verification. Please reach out to support.";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "hsl(220,50%,12%)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {/* Header */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
              <Icon size={18} style={{ color: accentColor }} />
            </div>
            <div>
              <div className="text-white font-bold text-sm">{label}</div>
              <div className="text-white/40 text-xs truncate max-w-[160px]">{accountName}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Info box */}
          <div className="p-3 rounded-2xl text-xs" style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
            <div className="font-semibold mb-0.5" style={{ color: accentColor }}>Custom Banner Message (Optional)</div>
            <div className="text-white/50 leading-relaxed">
              This message will appear at the top of the user's dashboard when they log in. Leave blank to show only the default status notice.
            </div>
          </div>

          {/* Message input */}
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Message to Display on User Dashboard</label>
            <textarea
              className="dark-input resize-none w-full text-sm leading-relaxed"
              rows={4}
              placeholder={placeholder}
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={300}
            />
            <div className="text-white/25 text-xs mt-1 text-right">{message.length}/300</div>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => onConfirm(message)}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              style={{ background: accentBg, color: accentColor, border: `1px solid ${accentBorder}` }}
            >
              <Send size={15} />
              {message.trim() ? `${label} with Message` : label}
            </button>
            <button
              onClick={() => onConfirm("")}
              className="w-full py-3 rounded-2xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <SkipForward size={13} /> Continue Without Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
