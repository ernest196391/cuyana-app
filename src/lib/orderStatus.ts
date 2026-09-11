export const STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo", color: "#6B7280" },
  { value: "confirmado", label: "Confirmado", color: "#D4A017" },
  { value: "pagado", label: "Pagado", color: "#7A0E2E" },
  { value: "entregado", label: "Entregado", color: "#10B981" },
  { value: "cancelado", label: "Cancelado", color: "#1F1B1D" },
] as const;

export function getStatusColor(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color ?? "#6B7280";
}

export function getStatusLabel(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}
