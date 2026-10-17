export function createSampleReceipt(amount: number, senderName: string, method: string, time: number) {
  const date = new Date(time);
  const day = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const clock = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const rows = [
    ["Sent via", method],
    ["From", senderName],
    ["To", "Premium Store"],
    ["Date", day],
    ["Time", clock],
    ["Fee", "Rs. 0.00"],
  ];

  const rowsSvg = rows
    .map(([label, value], index) => {
      const y = 336 + index * 38;
      return `<text x="40" y="${y}" font-family="Arial" font-size="13" fill="#6b7280">${label}</text><text x="320" y="${y}" text-anchor="end" font-family="Arial" font-size="13" fill="#111827" font-weight="bold">${value}</text>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640" viewBox="0 0 360 640">
  <rect width="360" height="640" fill="#f4f5f7"/>
  <rect width="360" height="170" fill="#1d2b36"/>
  <circle cx="180" cy="78" r="30" fill="#2fb36e"/>
  <path d="M166 79 l10 10 l20 -22" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="180" y="138" text-anchor="middle" font-family="Arial" font-size="17" fill="#fff" font-weight="bold">Transaction Successful</text>
  <rect x="20" y="190" width="320" height="380" rx="14" fill="#fff"/>
  <text x="180" y="236" text-anchor="middle" font-family="Arial" font-size="13" fill="#6b7280">Amount Sent</text>
  <text x="180" y="272" text-anchor="middle" font-family="Arial" font-size="30" fill="#111827" font-weight="bold">Rs. ${amount.toLocaleString()}.00</text>
  <line x1="40" y1="300" x2="320" y2="300" stroke="#e5e7eb"/>
  ${rowsSvg}
  <text x="180" y="610" text-anchor="middle" font-family="Arial" font-size="11" fill="#9ca3af">Sample payment receipt</text>
</svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
