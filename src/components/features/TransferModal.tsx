import { useState, useEffect } from "react";
import { X, Send, Building2, ChevronDown } from "lucide-react";
import { supabase, type Account, logAudit } from "@/lib/supabase";
import { toast } from "sonner";
import { BANK_SUGGESTIONS, generateTransactionId, formatCurrency } from "@/lib/utils";

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

  const currency = account.currency || "USD";
  const hasPin = Boolean(account.transfer_pin && String(account.transfer_pin).length > 0);

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

  const parseAmount = (raw: string): number => {
    const n = Number(String(raw).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : NaN;
  };

  const handleSubmit = async () => {
    const amt = parseAmount(amount);
    if (!amount || !Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!recipientName || !recipientBank || !recipientAccount) {
      toast.error("Fill in all recipient details");
      return;
    }
    // No artificial caps — any amount up to available balance is allowed (all tiers)
    const available = Number(account.balance);
    if (amt > available) {
      toast.error("Insufficient funds");
      return;
    }
    setStep("confirm");
  };

  const executeTransfer = async () => {
    setLoading(true);
    const amt = parseAmount(amount);

    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      setLoading(false);
      return;
    }

    try {
      // Re-fetch live balance so large transfers use current funds (all tiers, any currency)
      const { data: liveAccount, error: fetchError } = await supabase
        .from("banking_accounts")
        .select("id, balance, currency, suppress_tx_alerts, account_number, account_name, is_frozen, is_closed, is_inactive")
        .eq("id", account.id)
        .single();

      if (fetchError || !liveAccount) {
        toast.error("Could not verify account. Please try again.");
        setLoading(false);
        return;
      }

      if (liveAccount.is_frozen || liveAccount.is_closed || liveAccount.is_inactive) {
        toast.error("Account is restricted. Transfers are not available.");
        setLoading(false);
        return;
      }

      const currentBalance = Number(liveAccount.balance);
      if (!Number.isFinite(currentBalance) || amt > currentBalance) {
        toast.error("Insufficient funds");
        setLoading(false);
        return;
      }

      const newBalance = Math.round((currentBalance - amt) * 100) / 100;
      const txId = generateTransactionId();
      const txCurrency = liveAccount.currency || currency;

      const { error: txError } = await supabase.from("banking_transactions").insert({
        account_id: account.id,
        type: "debit",
        amount: amt,
        recipient_name: recipientName.trim(),
        recipient_bank: recipientBank.trim(),
        recipient_account_number: recipientAccount.trim(),
        description: description.trim() || "Transfer",
        transaction_id: txId,
        admin_override: false,
        custom_timestamp: new Date().toISOString(),
      });

      if (txError) {
        console.error("Transfer insert error:", txError);
        toast.error("Transaction failed. Please try again.");
        setLoading(false);
        return;
      }

      // CRITICAL: must update banking_accounts (not "accounts")
      const { error: balError } = await supabase
        .from("banking_accounts")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id);

      if (balError) {
        console.error("Balance update error:", balError);
        toast.error("Transfer recorded but balance update failed. Contact support.");
        setLoading(false);
        return;
      }

      if (!liveAccount.suppress_tx_alerts) {
        await supabase.from("banking_notifications").insert({
          account_id: account.id,
          target: account.id,
          title: "Debit Alert",
          body: `${formatCurrency(amt, txCurrency)} was debited from your BankUnited account (${liveAccount.account_number}) to ${recipientName.trim()}. Transaction ID: ${txId}. Available balance: ${formatCurrency(newBalance, txCurrency)}.`,
          is_read: false,
        });
      }

      await logAudit(
        "transfer",
        account.id,
        liveAccount.account_name || account.account_name,
        {
          amount: amt,
          currency: txCurrency,
          recipient: recipientName.trim(),
          bank: recipientBank.trim(),
          tx_id: txId,
        },
        liveAccount.account_name || account.account_name,
        "individual"
      );

      toast.success(`Transfer of ${formatCurrency(amt, txCurrency)} completed successfully`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Transfer error:", err);
      toast.error("Transaction failed. Please try again.");
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (hasPin) {
      if (pin !== String(account.transfer_pin)) {
        toast.error("Invalid transfer PIN");
        return;
      }
    }
    await executeTransfer();
  };

  const goToAuthorize = () => {
    if (hasPin) {
      setStep("pin");
    } else {
      // No PIN configured — authorize immediately
      executeTransfer();
    }
  };

  const amtDisplay = (() => {
    const n = parseAmount(amount);
    return Number.isFinite(n) ? formatCurrency(n, currency) : amount;
  })();

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
              <div className="text-white text-xl font-bold">{formatCurrency(Number(account.balance), currency)}</div>
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Amount ({currency})</label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className="dark-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="text-white/25 text-xs mt-1">Any amount up to your available balance is allowed</div>
            </div>

            {beneficiaries.length > 0 && (
              <div className="relative">
                <button onClick={() => setShowBeneficiaries(!showBeneficiaries)}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-white text-sm"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span>Select Beneficiary</span>
                  <ChevronDown size={16} className={`transition-transform ${showBeneficiaries ? "rotate-180" : ""}`} />
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
                <span className="text-white font-bold">{amtDisplay}</span>
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
              <button
                onClick={() => setStep("details")}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-white text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                Back
              </button>
              <button
                onClick={goToAuthorize}
                disabled={loading}
                className="flex-1 gold-btn py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  hasPin ? "Confirm" : "Authorize Transfer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "pin" && (
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "hsl(220,50%,12%)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-bold text-lg">Enter Transfer PIN</h3>
            <button onClick={() => setStep("confirm")} className="text-white/40 hover:text-white p-1" disabled={loading}><X size={20} /></button>
          </div>

          <div className="p-5 space-y-4">
            <div className="text-center text-white/40 text-sm mb-2">Enter your 4-digit PIN to authorize</div>
            <input
              type="password"
              maxLength={4}
              className="dark-input text-center text-2xl tracking-widest"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              disabled={loading}
            />

            <button
              onClick={handleConfirm}
              disabled={loading || pin.length !== 4}
              className="gold-btn w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                <><Send size={16} /> Authorize Transfer</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
