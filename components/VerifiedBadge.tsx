interface Props { size?: number }

export default function VerifiedBadge({ size = 15 }: Props) {
  return (
    <span
      title="משתמש מאומת"
      className="inline-flex items-center justify-center rounded-full flex-shrink-0 text-white font-bold"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
        fontSize: Math.round(size * 0.58),
        lineHeight: 1,
      }}
    >
      ✓
    </span>
  )
}
