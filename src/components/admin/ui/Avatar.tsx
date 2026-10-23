const hues = [210, 160, 30, 280, 340, 190, 100];

export default function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const letterSum = name.split("").reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const hue = hues[letterSum % hues.length];

  return (
    <div
      className="admin-avatar rounded-full grid place-items-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, ["--avatar-hue" as string]: hue }}
    >
      {initials}
    </div>
  );
}
