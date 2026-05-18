import { useState, useEffect } from "react";
import { X, Send, Building2, ChevronDown } from "lucide-react";
import { supabase, type Account, logAudit } from "@/lib/supabase";
import { toast } from "sonner";
import { BANK_SUGGESTIONS, generateTransactionId } from "@/lib/utils";

interface Props {
  account: Account;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferModal({ account, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [bankSuggestions, setBankSuggestions] = useState<string[]>([]);
  const [recipientAccount, setRecipientAccount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"details" | "confirm" | "pin">("details");
  const [loading, setLoading] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    const { data } = await supabase
      .from("beneficiaries")
      .select("*")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false });
    if (data) setBeneficiaries(data);
  };

  const handleBankInput = (val: string) => {
    setRecipientBank(val);
    if (val.length >= 2) {
      setBankSuggestions(BANK_SUGGESTIONS.filter(b => b.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
    } else {
      setBankSuggestions([]);
    }
  };

  const selectBeneficiary = (b: any) => {
    setRecipientName(b.name);
    setRecipientBank(b.bank_name);
    setRecipientAccount(b.account_number);
    setShowBeneficiaries(false);
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!recipientName || !recipientBank || !recipientAccount) {
      toast.error("Fill in all recipient details");
      return;
    }
    if (parseFloat(amount) > account.balance) {
      toast.error("Insufficient funds");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (pin !== account.transfer_pin) {
      toast.error("Invalid transfer PIN");
      return;
    }

    setLoading(true);
    const txId = generateTransactionId();
    const newBalance = account.balance - parseFloat(amount);

    const { error: txError } = await supabase.from("banking_transactions").insert({
      account_id: account.id,
      type: "debit",
      amount: parseFloat(amount),
      recipient_name: recipientName,
      recipient_bank: recipientBank,
      recipient_account_number: recipientAccount,
      description: description || "Transfer",
      transaction_id: txId,
      admin_override: false,
      custom_timestamp: new Date().toISOString(),
    });

    if (txError) {
      toast.error("Transaction failed");
      setLoading(false);
      return;
    }

    await supabase.from("accounts").update({ balance: newBalance }).eq("id", account.id);

    // Only create notification if suppression is OFF
    if (!account.suppress_tx_alerts) {
      await supabase.from("banking_notifications").insert({
        account_id: account.id,
        target: account.id,
        title: "Debit Alert",
        body: `$${parseFloat(amount).toFixed(2)} was debited from your BankUnited account (${account.account_number}) to ${recipientName}. Transaction ID: ${txId}. Available balance: $${newBalance.toFixed(2)}.`,
        is_read: false,
      });
    }

    await logAudit("transfer", account.id, account.account_name, {
      amount: parseFloat(amount),
      recipient: recipientName,
      bank: recipientBank,
      tx_id: txId,
    }, account.account_name, "individual");

    toast.success(`Transfer of $${parseFloat(amount).toFixed(2)} completed`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {step === "details" && (
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "hsl(220,50%,12%)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-bold text-lg">Transfer Funds</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white p-1"><X size={20} /></button>
          </div>
          
          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="text-white/40 text-xs mb-1">Available Balance</div>
              <div className="text-white text-xl font-bold">${account.balance.toFixed(2)}</div>
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Amount ($)</label>
              <input type="number" className="dark-input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            {beneficiaries.length > 0 && (
              <div className="relative">
                <button onClick={() => setShowBeneficiaries(!showBeneficiaries)}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-white text-sm"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span>Select Beneficiary</span>
                  <ChevronDown size={16} className={`transition-transform ${showBeneficiaries ? 'rotate-180' : ''}`} />
                </button>
                {showBeneficiaries && (
                  <div className="absolute top-full left-0 right-0 z-50 rounded-xl mt-1 max-h-48 overflow-y-auto"
                    style={{ background: "hsl(220,55%,14%)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {beneficiaries.map(b => (
                      <button key={b.id} onClick={() => selectBeneficiary(b)}
                        className="w-full text-left px-4 py-3 text-white text-sm hover:bg-white/5"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="font-medium">{b.name}</div>
                        <div className="text-white/40 text-xs">{b.bank_name} · {b.account_number}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Recipient Name</label>
              <input type="text" className="dark-input" placeholder="Full name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>

            <div className="relative">
              <label className="text-white/60 text-xs mb-1.5 block flex items-center gap-1.5"><Building2 size={12} /> Bank Name</label>
              <input type="text" className="dark-input" placeholder="Type bank name..." value={recipientBank} onChange={(e) => handleBankInput(e.target.value)} />
              {bankSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 rounded-xl overflow-hidden mt-1"
                  style={{ background: "hsl(220,55%,14%)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {bankSuggestions.map(b => (
                    <button key={b} onClick={() => { setRecipientBank(b); setBankSuggestions([]); }}
                      className="w-full text-left px-4 py-2.5 text-white text-xs hover:bg-white/5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Account Number</label>
              <input type="text" className="dark-input" placeholder="Recipient account number" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} />
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Description (Optional)</label>
              <input type="text" className="dark-input" placeholder="What's this for?" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <button onClick={handleSubmit} className="gold-btn w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2">
              Continue <ChevronDown size={16} className="-rotate-90" />
            </button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "hsl(220,50%,12%)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-bold text-lg">Confirm Transfer</h3>
            <button onClick={() => setStep("details")} className="text-white/40 hover:text-white p-1"><X size={20} /></button>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex justify-between">
                <span className="text-white/40 text-sm">Amount</span>
                <span className="text-white font-bold">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 text-sm">Recipient</span>
                <span className="text-white">{recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 text-sm">Bank</span>
                <span className="text-white">{recipientBank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 text-sm">Account</span>
                <span className="text-white font-mono">{recipientAccount}</span>
              </div>
              {description && (
                <div className="flex justify-between">
                  <span className="text-white/40 text-sm">Description</span>
                  <span className="text-white">{description}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("details")} className="flex-1 py-3 rounded-xl text-white text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                Back
              </button>
              <button onClick={() => setStep("pin")} className="flex-1 gold-btn py-3 text-sm font-semibold">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "pin" && (
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "hsl(220,50%,12%)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-bold text-lg">Enter Transfer PIN</h3>
            <button onClick={() => setStep("confirm")} className="text-white/40 hover:text-white p-1"><X size={20} /></button>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="text-center text-white/40 text-sm mb-2">Enter your 4-digit PIN to authorize</div>
            <input type="password" maxLength={4} className="dark-input text-center text-2xl tracking-widest"
              placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
            
            <button onClick={handleConfirm} disabled={loading || pin.length !== 4}
              className="gold-btn w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : <><Send size={16} /> Authorize Transfer</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}