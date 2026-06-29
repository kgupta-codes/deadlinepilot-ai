type Props = {
  className?: string;
};

export default function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white/8 ${className}`}
      aria-hidden="true"
    />
  );
}
