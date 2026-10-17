type BrandIconProps = {
  size?: number;
  className?: string;
};

export default function BrandIcon({ size = 36, className = "" }: BrandIconProps) {
  return (
    <img
      src="/logo-icon.png"
      alt="Premium Store"
      width={size}
      height={size}
      draggable={false}
      className={`shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
