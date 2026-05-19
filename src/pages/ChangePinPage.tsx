import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Shield, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import bankLogo from "@/assets/bankunited-logo.jpg";

type Step = "verify" | "new-pin" | "done";

export default function ChangePinPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("verify");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("banking_accounts")
      .select("id, login_email, login_password")
      .eq("login_email", email.trim().toLowerCase())
      .single();

    if (error || !data) {
      toast.error("No account found with that email.");
      setLoading(false);
      return;
    }
    if (data.login_password !== password.trim()) {
      toast.error("Incorrect password. Please try again.");
      setLoading(false);
      return;
    }
    setAccountId(data.id);
    setLoading(false);
    setStep("new-pin");
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match. Please try again.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("banking_accounts")
      .update({ transfer_pin: newPin, updated_at: new Date().toISOString() })
      .eq("id", accountId);

    if (error) {
      toast.error("Failed to update PIN. Please try again.");
      setLoading(false);
      return;
    }
    // Update local session if present
    const raw = localStorage.getItem("ghob_user_session");
    if (raw) {
      const session = JSON.parse(raw);
      if (session.id === accountId) {
        localStorage.setItem("ghob_user_session", JSON.stringify({ ...session, transfer_pin: newPin }));
      }
    }
    setLoading(false);
    setStep("done");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "hsl(220,45%,8%)" }}>
      <div className="w-full max-w-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="glass-card p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <img src={bankLogo} alt="BankUnited" className="w-14 h-14 rounded-2xl bg-white p-1 mb-4" />
            <h1 className="text-white font-bold text-lg">Change Transfer PIN</h1>
            <p className="text-white/40 text-xs mt-1">BankUnited · Secure PIN Management</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center">
            {["verify", "new-pin", "done"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  style={{ background: (step === s || (step === "done" && s !== "done") || (step === "new-pin" && s === "verify")) ? "hsl(43,85%,55%)" : "rgba(255,255,255,0.1)", color: (step === s || (step === "done" && s !== "done") || (step === "new-pin" && s === "verify")) ? "#111" : "rgba(255,255,255,0.3)" }}>
                  {i + 1}
                </div>
                {i < 2 && <div className="w-8 h-0.5 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Verify Identity */}
          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3 rounded-2xl text-xs" style={{ background: "rgba(200,155,50,0.07)", border: "1px solid rgba(200,155,50,0.2)" }}>
                <div className="text-yellow-400/80 font-semibold mb-0.5">Identity Verification</div>
                <div className="text-white/50">Enter your account login credentials to verify your identity before changing your Transfer PIN.</div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Account Email</label>
                <input type="email" className="dark-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Login Password</label>
                <input type="password" className="dark-input" placeholder="Your current password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="gold-btn w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 min-h-[52px]">
                {loading ? <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : <><Shield size={15} /> Verify Identity</>}
              </button>
            </form>
          )}

          {/* Step 2: New PIN */}
          {step === "new-pin" && (
            <form onSubmit={handleSetPin} className="space-y-4">
              <div className="p-3 rounded-2xl text-xs" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="text-green-400/80 font-semibold mb-0.5">Identity Verified ✓</div>
                <div className="text-white/50">Create a new 4-digit Transfer PIN. This PIN is used to authorize all transfers from your account.</div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">New Transfer PIN</label>
                <input
                  type="password"
                  className="dark-input text-center text-2xl tracking-[0.5em]"
                  placeholder="••••"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Confirm New PIN</label>
                <input
                  type="password"
                  className="dark-input text-center text-2xl tracking-[0.5em]"
                  placeholder="••••"
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
              {confirmPin.length === 4 && newPin !== confirmPin && (
                <div className="text-red-400 text-xs text-center">PINs do not match</div>
              )}
              <button type="submit" disabled={loading || newPin.length !== 4 || confirmPin.length !== 4} className="gold-btn w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 min-h-[52px]" style={{ opacity: (newPin.length !== 4 || confirmPin.length !== 4) ? 0.5 : 1 }}>
                {loading ? <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : <><Lock size={15} /> Validate New PIN</>}
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
                <div className="text-white font-bold text-lg">PIN Updated Successfully</div>
                <div className="text-white/50 text-sm mt-1">Your new Transfer PIN is active immediately. Use it to authorize transfers on your account.</div>
              </div>
              <button onClick={() => navigate("/dashboard")} className="gold-btn w-full py-3.5 text-sm font-semibold">
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
