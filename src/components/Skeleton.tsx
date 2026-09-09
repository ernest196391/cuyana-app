export default function Skeleton({ width, dark = false }: { width: string; dark?: boolean }) {
  return (
    <span
      className={`skeleton${dark ? " skeleton-dark" : ""}`}
      style={{ width }}
      aria-hidden="true"
    />
  );
}
