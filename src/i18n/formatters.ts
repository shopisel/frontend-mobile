export function formatCurrency(value: number, language: string) {
  return new Intl.NumberFormat(language === "pt" ? "pt-PT" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
