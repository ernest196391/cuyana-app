export const STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo", color: "#6B5F5A" },
  { value: "confirmado", label: "Confirmado", color: "#C89B3C" },
  { value: "pagado", label: "Pagado", color: "#6E1423" },
  { value: "entregado", label: "Entregado", color: "#1E7A4B" },
  { value: "cancelado", label: "Cancelado", color: "#1C1A1F" },
] as const;

export function getStatusColor(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color ?? "#6B5F5A";
}

export function getStatusLabel(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}
