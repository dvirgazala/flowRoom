'use client'
import { useState } from 'react'
import { X, CreditCard, Lock, Check, Loader2 } from 'lucide-react'

interface Props {
  productTitle: string
  productPrice: number
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentModal({ productTitle, productPrice, onClose, onSuccess }: Props) {
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)

  const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4)
    return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d
  }

  const handlePay = () => {
    if (!cardNumber.trim() || !cardName.trim() || !expiry.trim() || !cvv.trim()) return
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setDone(true)
      setTimeout(() => onSuccess(), 1200)
    }, 2000)
  }

  // Visual card color based on first digit
  const cardBg = cardNumber[0] === '4' ? 'from-purple/70 to-blue-600/60'
    : cardNumber[0] === '5' ? 'from-pink/60 to-purple/60'
    : 'from-purple/50 to-pink/40'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[400] flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-bg1 rounded-2xl w-full max-w-sm overflow-hidden modal-card"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 16px 64px rgba(0,0,0,0.9)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-purple" />
            <p className="font-semibold text-sm">תשלום מאובטח</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg3 transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-5">
          {done ? (
            /* Success state */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-success" />
              </div>
              <p className="font-bold text-lg text-success mb-1">תשלום בוצע!</p>
              <p className="text-text-muted text-sm">"{productTitle}" נרכש בהצלחה</p>
            </div>
          ) : (
            <>
              {/* Product summary */}
              <div className="flex items-center justify-between mb-5 px-3 py-2.5 bg-bg2 rounded-xl">
                <p className="text-sm text-text-secondary truncate">{productTitle}</p>
                <p className="font-bold text-purple text-sm flex-shrink-0 mr-2">₪{productPrice}</p>
              </div>

              {/* Visual card preview */}
              <div className={`relative w-full h-36 rounded-2xl bg-gradient-to-br ${cardBg} p-5 mb-5 overflow-hidden`}
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div className="flex justify-between items-start mb-4">
                  <CreditCard size={20} className="text-white/80" />
                  <div className="text-white/60 text-xs font-medium">
                    {cardNumber[0] === '4' ? 'VISA' : cardNumber[0] === '5' ? 'MASTERCARD' : 'CARD'}
                  </div>
                </div>
                <p className="text-white font-mono text-sm tracking-widest mb-3">
                  {cardNumber || '•••• •••• •••• ••••'}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/50 text-xs mb-0.5">שם</p>
                    <p className="text-white text-xs font-medium uppercase">{cardName || 'YOUR NAME'}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-white/50 text-xs mb-0.5">תוקף</p>
                    <p className="text-white text-xs font-medium">{expiry || 'MM/YY'}</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <input
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCard(e.target.value))}
                  placeholder="מספר כרטיס"
                  inputMode="numeric"
                  className="w-full bg-bg3 rounded-xl px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors tracking-widest text-left"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                />
                <input
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  placeholder="שם בעל הכרטיס"
                  className="w-full bg-bg3 rounded-xl px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                />
                <div className="flex gap-3">
                  <input
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    className="flex-1 bg-bg3 rounded-xl px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors text-left"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                  />
                  <input
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="CVV"
                    inputMode="numeric"
                    className="w-20 bg-bg3 rounded-xl px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors text-left"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                  />
                </div>
              </div>

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={processing || !cardNumber.trim() || !cardName.trim() || !expiry.trim() || !cvv.trim()}
                className="w-full mt-4 py-3 bg-brand-gradient rounded-xl font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-glow-sm flex items-center justify-center gap-2">
                {processing ? (
                  <><Loader2 size={16} className="animate-spin" /> מעבד תשלום...</>
                ) : (
                  <><Lock size={14} /> שלם ₪{productPrice}</>
                )}
              </button>

              <p className="text-center text-text-muted text-xs mt-3 flex items-center justify-center gap-1">
                <Lock size={11} /> מאובטח ב-SSL · פרטייך מוצפנים
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
