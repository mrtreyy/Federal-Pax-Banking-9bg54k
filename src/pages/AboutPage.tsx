import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, TrendingUp, MapPin, Shield, Globe, Award, Scale, Users, Landmark } from "lucide-react";
import bankLogo from "@/assets/bankunited-logo.jpg";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-16" style={{ background: "hsl(220,45%,8%)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-5 pt-12 pb-4" style={{ background: "hsl(220,55%,12%)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-white font-bold">About BankUnited</div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Hero */}
        <div className="rounded-3xl p-6 text-center" style={{ background: "linear-gradient(135deg, hsl(220,60%,18%) 0%, hsl(220,70%,12%) 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <img src={bankLogo} alt="BankUnited" className="w-20 h-20 rounded-2xl bg-white p-2 mx-auto mb-4" />
          <h1 className="text-white font-bold text-2xl">BankUnited</h1>
          <p className="text-white/50 text-sm mt-1">A trusted financial institution serving communities across America</p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(200,155,50,0.15)", color: "hsl(43,85%,60%)", border: "1px solid rgba(200,155,50,0.3)" }}>NYSE: BKU</span>
            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}>Founded 2009</span>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Building2, label: "Headquarters", value: "Miami Lakes, Florida" },
            { icon: TrendingUp, label: "Total Assets", value: "$35.0 Billion" },
            { icon: MapPin, label: "Primary Markets", value: "Florida & 5 States" },
            { icon: Users, label: "Type", value: "Public Bank Holding Company" },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <stat.icon size={16} style={{ color: "hsl(43,85%,60%)" }} className="mb-2" />
              <div className="text-white/40 text-xs">{stat.label}</div>
              <div className="text-white font-semibold text-sm mt-0.5">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* About section */}
        <div className="rounded-3xl p-5 space-y-3" style={{ background: "hsl(220,50%,13%)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-white font-bold text-base flex items-center gap-2"><Landmark size={16} style={{ color: "hsl(43,85%,60%)" }} /> Our Story</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            BankUnited was established in 2009 and is headquartered in Miami Lakes, Florida. The bank is publicly traded on the New York Stock Exchange under the ticker symbol BKU and is included in the Russell 1000 and S&P 600 indices. BankUnited is one of the largest independent depository institutions headquartered in Florida, serving individuals, businesses, and communities across its key markets.
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            With total assets exceeding $35.0 billion as of December 2025, BankUnited has built a reputation for financial stability, customer trust, and innovative banking services. The bank operates across Florida, the New York tri-state area, Dallas, Atlanta, and Charlotte.
          </p>
        </div>

        {/* Markets */}
        <div className="rounded-3xl p-5" style={{ background: "hsl(220,50%,13%)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-white font-bold text-base flex items-center gap-2 mb-3"><Globe size={16} style={{ color: "hsl(43,85%,60%)" }} /> Geographic Presence</h2>
          {[
            { market: "Florida", note: "Primary market and headquarters state — Miami Lakes, Orlando, Tampa, Fort Lauderdale, Jacksonville" },
            { market: "New York Tri-State Area", note: "Manhattan, New Jersey, Connecticut — serving metro and suburban communities" },
            { market: "Dallas, Texas", note: "Commercial and personal banking operations in the DFW metroplex" },
            { market: "Atlanta, Georgia", note: "Serving the Southeast with dedicated banking solutions" },
            { market: "Charlotte, North Carolina", note: "Commercial banking and wealth management services" },
          ].map(m => (
            <div key={m.market} className="py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-white text-sm font-semibold">{m.market}</div>
              <div className="text-white/40 text-xs mt-0.5">{m.note}</div>
            </div>
          ))}
        </div>

        {/* Products & Services */}
        <div className="rounded-3xl p-5" style={{ background: "hsl(220,50%,13%)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-white font-bold text-base flex items-center gap-2 mb-3"><Award size={16} style={{ color: "hsl(43,85%,60%)" }} /> Products & Services</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {["Personal Checking & Savings", "Business Banking", "Multi-Currency Accounts", "Virtual Debit Cards", "Wire Transfers", "Loan Products", "Savings Goals", "Bill Payments", "Cheque Books", "Account Statements", "Beneficiary Management", "Transaction Disputes"].map(s => (
              <div key={s} className="flex items-center gap-2 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(43,85%,60%)" }} />
                <span className="text-white/60">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory & Legal */}
        <div className="rounded-3xl p-5" style={{ background: "hsl(220,50%,13%)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-white font-bold text-base flex items-center gap-2 mb-3"><Scale size={16} style={{ color: "hsl(43,85%,60%)" }} /> Regulatory Framework & Compliance</h2>
          <div className="space-y-3 text-sm text-white/60 leading-relaxed">
            <p>BankUnited operates under the regulatory supervision of the <strong className="text-white/80">Federal Deposit Insurance Corporation (FDIC)</strong> and the <strong className="text-white/80">Office of the Comptroller of the Currency (OCC)</strong>. All deposits are FDIC-insured up to the applicable limits.</p>
            <p>The bank fully complies with the <strong className="text-white/80">Bank Secrecy Act (BSA)</strong>, which requires financial institutions to assist government agencies in detecting and preventing money laundering. BankUnited maintains robust Anti-Money Laundering (AML) programs in line with BSA requirements.</p>
            <p>As a publicly traded institution, BankUnited adheres to all provisions of the <strong className="text-white/80">Dodd-Frank Wall Street Reform and Consumer Protection Act</strong>, ensuring transparency and consumer protection in all financial dealings.</p>
            <p>BankUnited is committed to compliance with the <strong className="text-white/80">Equal Credit Opportunity Act (ECOA)</strong> and the <strong className="text-white/80">Community Reinvestment Act (CRA)</strong>, ensuring fair lending practices across all communities it serves.</p>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-3xl p-5" style={{ background: "rgba(200,155,50,0.06)", border: "1px solid rgba(200,155,50,0.2)" }}>
          <h2 className="text-white font-bold text-base flex items-center gap-2 mb-3"><Shield size={16} style={{ color: "hsl(43,85%,60%)" }} /> Security & Privacy</h2>
          <div className="space-y-2 text-sm text-white/60 leading-relaxed">
            <p>All transactions and account data at BankUnited are protected by <strong className="text-white/80">256-bit SSL/TLS encryption</strong>, the same standard used by major financial institutions worldwide.</p>
            <p>BankUnited employs multi-factor authentication, real-time fraud monitoring, and biometric device verification to protect customer accounts at all times.</p>
            <p>Our privacy practices comply with the <strong className="text-white/80">Gramm-Leach-Bliley Act (GLBA)</strong>, ensuring your financial information is never shared without your consent.</p>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-3xl p-5 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-white/40 text-xs mb-1">Official Support</div>
          <div className="text-white font-semibold">bankunitedbku@gmail.com</div>
          <div className="text-white/30 text-xs mt-1">BankUnited Headquarters · Miami Lakes, Florida</div>
          <button
            onClick={() => window.location.href = "mailto:bankunitedbku@gmail.com"}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(200,155,50,0.1)", color: "hsl(43,85%,60%)", border: "1px solid rgba(200,155,50,0.2)" }}>
            Contact Support
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-white/20 text-xs pb-4">
          © 2015 BankUnited, N.A. All rights reserved.<br />
          FDIC Insured · Equal Housing Lender
        </div>
      </div>
    </div>
  );
}
