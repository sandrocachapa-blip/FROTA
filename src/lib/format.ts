export const currencyFormatter = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

export const numberFormatter = new Intl.NumberFormat("pt-PT");

export function formatCurrency(value: number | string | null | undefined) {
  return currencyFormatter.format(Number(value ?? 0)).replace("AOA", "Kz");
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-PT").format(
    typeof value === "string" ? new Date(`${value}T12:00:00`) : value,
  );
}

