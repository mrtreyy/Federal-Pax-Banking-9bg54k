import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, CheckCircle, Crown } from "lucide-react";
import { toast } from "sonner";
import bankLogo from "@/assets/bankunited-logo.jpg";

// CEO password is stored as a constant in CASLogin — we allow reset via "Ceoaccess" identifier
const CEO_IDENTIFIER = "Ceoaccess";
let CEOPasswordOverride: string | null = null; // runtime session override

// We expose a way to update this so CASLogin can read it
export function getCEOPasswordOverride() { return CEOPasswordOverride; }

type Step = "identifier" | "new-password" | "done";

interface Props {
  returnPath?: string;
}

export default function ForgotPasswordCEO({ returnPath = "/cas/login" }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (pw: string) => {
    if (pw.length < 6) return "Password must be at least 6 characters.";
    if (!/^[A-Z]/.test(pw)) return "Password must start with an uppercase letter.";
    return null;
  };

  const handleIdentifier = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier.trim().toLowerCase() !== CEO_IDENTIFIER.toLowerCase()) {
      toast.error("Incorrect CEO identifier. Please verify and try again.");
      return;
    }
    setStep("new-password");
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(newPassword);
    if (pwError) { toast.error(pwError); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    // Store override in session storage for CASLogin to check
    sessionStorage.setItem("cas_password_override", newPassword);
    CEOPasswordOverride = newPassword;
    setTimeout(() => {
      setLoading(false);
      setStep("done");
    }, 800);
  };

  const passwordError = newPassword ? validatePassword(newPassword) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "hsl(220,45%,8%)" }}>
      <div className="w-full max-w-sm">
        <button onClick={() => navigate(returnPath)} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="glass-card p-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, hsl(43,85%,55%), hsl(38,80%,42%))" }}>
              <Crown size={24} className="text-gray-900" />
            </div>
            <h1 className="text-white font-bold text-lg">CEO Password Reset</h1>
            <p className="text-white/40 text-xs mt-1">BankUnited · CEO Administrative System</p>
          </div>

          {step === "identifier" && (
            <form onSubmit={handleIdentifier} className="space-y-4">
              <div className="p-3 rounded-2xl text-xs" style={{ background: "rgba(200,155,50,0.07)", border: "1px solid rgba(200,155,50,0.2)" }}>
                <div className="text-yellow-400/80 font-semibold mb-0.5">CEO Verification</div>
                <div className="text-white/50">Enter the CEO system identifier to proceed with password reset.</div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">CEO System Identifier</label>
                <input type="text" className="dark-input" placeholder="Enter CEO identifier" value={identifier} onChange={e => setIdentifier(e.target.value)} />
                <div className="text-white/25 text-xs mt-1">Hint: This is your designated system access name.</div>
              </div>
              <button type="submit" className="gold-btn w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 min-h-[52px]">
                <Crown size={15} /> Verify & Continue
              </button>
            </form>
          )}

          {step === "new-password" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="p-3 rounded-2xl text-xs" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="text-green-400/80 font-semibold mb-0.5">Identity Confirmed ✓</div>
                <div className="text-white/50">Set a new CEO access password. Uppercase start, min 6 characters.</div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">New CEO Password</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} className="dark-input pr-12" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" onClick={() => setShowNew(!showNew)}>{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                {passwordError && newPassword && <div className="text-red-400 text-xs mt-1">{passwordError}</div>}
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} className="dark-input pr-12" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && <div className="text-red-400 text-xs mt-1">Passwords do not match</div>}
              </div>
              <button type="submit" disabled={loading || !!passwordError || newPassword !== confirmPassword || !newPassword}
                className="gold-btn w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 min-h-[52px]"
                style={{ opacity: (!!passwordError || newPassword !== confirmPassword || !newPassword) ? 0.5 : 1 }}>
                {loading ? <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : "Reset CEO Password"}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(34,197,94,0.15)" }}>
                <CheckCircle size={36} color="#22c55e" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">CEO Password Reset</div>
                <div className="text-white/50 text-sm mt-1">Your new CEO access password is now active for this session. Sign in with your new password.</div>
              </div>
              <button onClick={() => navigate(returnPath)} className="gold-btn w-full py-3.5 text-sm font-semibold">
                Return to CEO Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
