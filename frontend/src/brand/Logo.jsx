export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Minimal logo resembling the provided brand: red mark + text */}
      <svg width="24" height="24" viewBox="0 0 24 24" className="text-brandRed" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
        <path d="M9 8h6v8H9z" fill="#0b0b0b" />
      </svg>
      <span className="text-xl font-semibold tracking-wide">revlinks</span>
    </div>
  );
}