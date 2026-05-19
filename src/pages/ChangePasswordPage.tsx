import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Shield, CheckCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import bankLogo from "@/assets/bankunited-logo.jpg";

type Step = "verify" | "new-password" | "done";
type VerifyMethod = "email" | "pin";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("verify");
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>("email");
  const [emailInput, setEmailInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState("");

  // Pre-fill email from session
  const raw = localStorage.getItem("ghob_user_session");
  const session = raw ? JSON.parse(raw) : null;

  const validatePassword = (pw: string) => {
    if (pw.length < 6) return "Password must be at least 6 characters.";
    if (!/^[A-Z]/.test(pw)) return "Password must start with an uppercase letter.";
    return null;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (verifyMethod === "email") {
      if (!emailInput.trim()) {
        toast.error("Please enter your email address.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("banking_accounts")
        .select("id, login_email")
        .eq("login_email", emailInput.trim().toLowerCase())
        .single();
      if (error || !data) {
        toast.error("No account found with that email.");
        setLoading(false);
        return;
      }
      setAccountId(data.id);
    } else {
      // PIN verification
      if (pinInput.length !== 4) {
        toast.error("Please enter your 4-digit Transfer PIN.");
        setLoading(false);
        return;
      }
      if (!session?.id) {
        toast.error("Session expired. Please log in again.");
        setLoading(false);
        navigate("/");
        return;
      }
      const { data, error } = await supabase
        .from("banking_accounts")
        .select("id, transfer_pin")
        .eq("id", session.id)
        .single();
      if (error || !data || data.transfer_pin !== pinInput) {
        toast.error("Incorrect Transfer PIN.");
        setLoading(false);
        return;
      }
      setAccountId(data.id);
    }

    setLoading(false);
    setStep("new-password");
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(newPassword);
    if (pwError) { toast.error(pwError); return; }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("banking_accounts")
      .update({ login_password: newPassword, updated_at: new Date().toISOString() })
      .eq("id", accountId);

    if (error) {
      toast.error("Failed to update password. Please try again.");
      setLoading(false);
      return;
    }
    // Update local session
    const raw2 = localStorage.getItem("ghob_user_session");
    if (raw2) {
      const s = JSON.parse(raw2);
      if (s.id === accountId) {
        localStorage.setItem("ghob_user_session", JSON.stringify({ ...s, login_password: newPassword }));
      }
    }
    setLoading(false);
    setStep("done");
  };

  const passwordError = newPassword ? validatePassword(newPassword) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{ background: "hsl(220,45%,8%)" }}>
      <div className="w-full max-w-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="glass-card p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <img src={bankLogo} alt="BankUnited" className="w-14 h-14 rounded-2xl bg-white p-1 mb-4" />
            <h1 className="text-white font-bold text-lg">Change Login Password</h1>
            <p className="text-white/40 text-xs mt-1">BankUnited · Secure Account Management</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {["verify", "new-password", "done"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: (step === "done" || (step === "new-password" && i < 2) || step === s) ? "hsl(43,85%,55%)" : "rgba(255,255,255,0.1)", color: (step === "done" || (step === "new-password" && i < 2) || step === s) ? "#111" : "rgba(255,255,255,0.3)" }}>
                  {i + 1}
                </div>
                {i < 2 && <div className="w-8 h-0.5 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Verify */}
          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3 rounded-2xl text-xs" style={{ background: "rgba(200,155,50,0.07)", border: "1px solid rgba(200,155,50,0.2)" }}>
                <div className="text-yellow-400/80 font-semibold mb-0.5">Identity Verification Required</div>
                <div className="text-white/50">Choose a verification method to confirm your identity before setting a new password.</div>
              </div>

              {/* Method selector */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setVerifyMethod("email")}
                  className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={verifyMethod === "email" ? { background: "hsl(43,85%,55%)", color: "#111" } : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                  Email Address
                </button>
                <button type="button" onClick={() => setVerifyMethod("pin")}
                  className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={verifyMethod === "pin" ? { background: "hsl(43,85%,55%)", color: "#111" } : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                  Transfer PIN
                </button>
              </div>

              {verifyMethod === "email" ? (
                <div>
                  <label className="text-white/60 text-xs mb-1.5 block">Account Email Address</label>
                  <input type="email" className="dark-input" placeholder="your@email.com" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
                </div>
              ) : (
                <div>
                  <label className="text-white/60 text-xs mb-1.5 block">4-Digit Transfer PIN</label>
                  <input type="password" className="dark-input text-center text-2xl tracking-[0.5em]" placeholder="••••" maxLength={4}
                    value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                </div>
              )}

              <button type="submit" disabled={loading} className="gold-btn w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 min-h-[52px]">
                {loading ? <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : <><Shield size={15} /> Verify & Continue</>}
              </button>
            </form>
          )}

          {/* Step 2: New Password */}
          {step === "new-password" && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="p-3 rounded-2xl text-xs" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="text-green-400/80 font-semibold mb-0.5">Verified ✓</div>
                <div className="text-white/50">Create your new password. It must start with an uppercase letter and be at least 6 characters long.</div>
              </div>

              {/* Password rules */}
              <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-white/40 font-semibold mb-1">Password Requirements</div>
                <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? "text-green-400" : "text-white/30"}`}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: newPassword.length >= 6 ? "#22c55e" : "rgba(255,255,255,0.2)" }} />
                  Minimum 6 characters
                </div>
                <div className={`flex items-center gap-1.5 ${/^[A-Z]/.test(newPassword) ? "text-green-400" : "text-white/30"}`}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: /^[A-Z]/.test(newPassword) ? "#22c55e" : "rgba(255,255,255,0.2)" }} />
                  Starts with uppercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${newPassword && newPassword === confirmPassword ? "text-green-400" : "text-white/30"}`}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: newPassword && newPassword === confirmPassword ? "#22c55e" : "rgba(255,255,255,0.2)" }} />
                  Both passwords match
                </div>
              </div>

              <div>
                <label className="text-white/60 text-xs mb-1.5 block">New Password</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} className="dark-input pr-12" placeholder="New password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70" onClick={() => setShowNew(!showNew)}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError && newPassword && <div className="text-red-400 text-xs mt-1">{passwordError}</div>}
              </div>

              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} className="dark-input pr-12" placeholder="Confirm password..." value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && <div className="text-red-400 text-xs mt-1">Passwords do not match</div>}
              </div>

              <button type="submit" disabled={loading || !!passwordError || newPassword !== confirmPassword || !newPassword}
                className="gold-btn w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 min-h-[52px]"
                style={{ opacity: (!!passwordError || newPassword !== confirmPassword || !newPassword) ? 0.5 : 1 }}>
                {loading ? <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : <><Lock size={15} /> Validate New Password</>}
              </button>
            </form>
          )}

          {/* Step 3: Done */}
          {step === "done" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(34,197,94,0.15)" }}>
                <CheckCircle size={36} color="#22c55e" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">Password Updated</div>
                <div className="text-white/50 text-sm mt-1">Your new login password is active. Use it the next time you sign in to BankUnited.</div>
              </div>
              <button onClick={() => { localStorage.removeItem("ghob_user_session"); navigate("/"); }} className="gold-btn w-full py-3.5 text-sm font-semibold">
                Sign In with New Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
