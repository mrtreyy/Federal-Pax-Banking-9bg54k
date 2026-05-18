import { useState } from "react";
import { X, Save, Building2, BellOff } from "lucide-react";
import { supabase, type Account, logAudit } from "@/lib/supabase";
import { toast } from "sonner";

interface Props {
  account: Account;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CASEditAccountModal({ account, onClose, onSuccess }: Props) {
  const [accountName, setAccountName] = useState(account.account_name || "");
  const [email, setEmail] = useState(account.login_email || "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(account.phone || "");
  const [address, setAddress] = useState(account.address || "");
  const [state, setState] = useState(account.state || "");
  const [country, setCountry] = useState(account.country || "");
  const [zipcode, setZipcode] = useState(account.zipcode || "");
  const [transferPin, setTransferPin] = useState(account.transfer_pin || "");
  const [accountTier, setAccountTier] = useState(account.account_tier || 1);
  const [isFrozen, setIsFrozen] = useState(account.is_frozen || false);
  const [suppressTxAlerts, setSuppressTxAlerts] = useState(account.suppress_tx_alerts || false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    const updates: any = {
      account_name: accountName.trim(),
      login_email: email.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      state: state.trim() || null,
      country: country.trim() || null,
      zipcode: zipcode.trim() || null,
      transfer_pin: transferPin.trim() || null,
      account_tier: accountTier,
      is_frozen: isFrozen,
      suppress_tx_alerts: suppressTxAlerts,
      updated_at: new Date().toISOString(),
    };

    if (password.trim()) {
      updates.login_password = password.trim();
    }

    const { error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", account.id);

    if (error) {
      toast.error("Failed to update account.");
      setLoading(false);
      return;
    }

    await logAudit(
      "edit_account",
      account.id,
      account.account_name,
      {
        changes: {
          account_name: accountName,
          email: email,
          tier: accountTier,
          frozen: isFrozen,
          suppress_tx_alerts: suppressTxAlerts,
        },
      },
      "CEO",
      "cas"
    );

    toast.success("Account updated successfully.");
    onSuccess();
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "hsl(220,50%,12%)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-lg">Edit Account</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><X size={20} /></button>
        </div>
        
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="text-white/40 text-xs mb-1">Account Number</div>
            <div className="text-white font-mono">{account.account_number}</div>
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Account Name</label>
            <input type="text" className="dark-input" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Login Email</label>
            <input type="email" className="dark-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">New Password (leave blank to keep)</label>
            <input type="text" className="dark-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Phone</label>
            <input type="text" className="dark-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Address</label>
            <input type="text" className="dark-input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">State</label>
              <input type="text" className="dark-input" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Country</label>
              <input type="text" className="dark-input" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">ZIP Code</label>
            <input type="text" className="dark-input" value={zipcode} onChange={(e) => setZipcode(e.target.value)} />
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Transfer PIN</label>
            <input type="text" maxLength={4} className="dark-input" value={transferPin} onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Account Tier</label>
            <select className="dark-input" value={accountTier} onChange={(e) => setAccountTier(parseInt(e.target.value))}>
              <option value={1}>Tier 1 - Standard</option>
              <option value={2}>Tier 2 - Silver</option>
              <option value={3}>Tier 3 - Gold</option>
              <option value={4}>Tier 4 - Platinum</option>
              <option value={5}>Tier 5 - Elite</option>
            </select>
          </div>

          <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm font-medium">Freeze Account</div>
                <div className="text-white/40 text-xs">Prevent all transactions</div>
              </div>
              <button
                onClick={() => setIsFrozen(!isFrozen)}
                className={`w-11 h-6 rounded-full transition-colors ${isFrozen ? 'bg-red-500' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isFrozen ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellOff size={16} className={suppressTxAlerts ? "text-blue-400" : "text-white/30"} />
                <div>
                  <div className="text-white text-sm font-medium">Suppress Transaction Alerts</div>
                  <div className="text-white/40 text-xs">Hide all past and future debit/credit alerts</div>
                </div>
              </div>
              <button
                onClick={() => setSuppressTxAlerts(!suppressTxAlerts)}
                className={`w-11 h-6 rounded-full transition-colors ${suppressTxAlerts ? 'bg-blue-500' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${suppressTxAlerts ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {suppressTxAlerts && (
              <div className="mt-3 text-xs text-blue-400/80">
                Transaction alerts are hidden from this user's notification panel.
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={loading}
            className="gold-btn w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}