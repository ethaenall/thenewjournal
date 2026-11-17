export default function Cassette({ label = "songs, side A", className = "table-cassette" }: { label?: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 128" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="198" height="126" rx="8" fill="#26231f" />
      <rect x="14" y="12" width="172" height="74" rx="4" fill="#efe3c8" />
      <rect x="14" y="12" width="172" height="16" rx="4" fill="#c4553a" />
      <path d="M26 44h148" stroke="#b8a888" strokeWidth="1" />
      <text x="28" y="40" fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontSize="13" fill="#3b2a1c">{label}</text>
      <rect x="50" y="50" width="100" height="30" rx="15" fill="#1a1815" />
      <circle cx="66" cy="65" r="11" fill="#efe3c8" />
      <circle cx="134" cy="65" r="11" fill="#efe3c8" />
      <circle cx="66" cy="65" r="5" fill="#1a1815" />
      <circle cx="134" cy="65" r="5" fill="#1a1815" />
      <path d="M44 126l10-26h92l10 26" fill="#34302a" />
      <circle cx="74" cy="114" r="4" fill="#1a1815" />
      <circle cx="126" cy="114" r="4" fill="#1a1815" />
    </svg>
  );
}
