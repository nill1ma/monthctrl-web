import { formatCurrency } from "@/app/lib/currency";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Transaction = {
  label: string;
  value: number;
  currency: string;
};

type PdfData = {
  reference: string;
  incomings: Transaction[];
  expenses: Transaction[];
};

export type TransactionType = "all" | "incoming" | "expense";

export type DetailedTransaction = {
  reference: string;
  description: string;
  value: number;
  currency: string;
  type: "incoming" | "expense";
};

// ─── Shared CSS (idêntico ao mobile) ─────────────────────────────────────────

const BASE_STYLES = `
  body { font-family: -apple-system, sans-serif; padding: 32px; color: #111; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .generated { font-size: 11px; color: #888; margin-bottom: 24px; }
  .section { margin-bottom: 32px; }
  .currency-badge {
    display: inline-block;
    background: #208AEF;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 12px;
    margin-bottom: 12px;
  }
  .section-label {
    font-size: 13px;
    font-weight: 600;
    margin: 12px 0 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .section-label.incoming { color: #10B981; }
  .section-label.expense { color: #EF4444; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 4px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
  .totals { margin-top: 16px; border-top: 2px solid #e5e7eb; padding-top: 12px; }
  .total-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
  .total-row.balance { font-weight: 700; font-size: 15px; margin-top: 4px; }
`;

const EXPORT_STYLES = `
  body { font-family: -apple-system, sans-serif; padding: 32px; color: #111; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { font-size: 13px; color: #666; margin-bottom: 32px; }
  .reference-section { margin-bottom: 32px; }
  .reference-title { font-size: 18px; font-weight: 700; border-bottom: 2px solid #e0e0e0; padding-bottom: 6px; margin-bottom: 12px; }
  .currency-section { margin-bottom: 16px; padding-left: 12px; }
  .currency-title { font-size: 14px; font-weight: 600; color: #444; margin-bottom: 6px; }
  .section-label { font-size: 12px; font-weight: 600; color: #888; margin: 8px 0 4px; text-transform: uppercase; }
  .income-label { color: #16a34a; }
  .expense-label { color: #dc2626; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 5px 0; font-size: 14px; }
  td:last-child { text-align: right; }
  .subtotal td { font-weight: 600; border-top: 1px solid #f0f0f0; padding-top: 6px; }
  .balance-row td { font-weight: 700; border-top: 2px solid #e0e0e0; padding-top: 8px; margin-top: 8px; }
  .income { color: #16a34a; }
  .expense { color: #dc2626; }
  .generated { font-size: 11px; color: #999; margin-top: 40px; }
`;

// ─── A: Export de um mês (details page) ──────────────────────────────────────

export function buildDetailsPdfHtml({
  reference,
  incomings,
  expenses,
}: PdfData): string {
  const currencies = Array.from(
    new Set([
      ...incomings.map((i) => i.currency),
      ...expenses.map((e) => e.currency),
    ]),
  );

  const sectionsHtml = currencies
    .map((currency) => {
      const inc = incomings.filter((i) => i.currency === currency);
      const exp = expenses.filter((e) => e.currency === currency);

      const totalIncoming = inc.reduce((sum, i) => sum + i.value, 0);
      const totalExpense = exp.reduce((sum, e) => sum + e.value, 0);
      const balance = totalIncoming - totalExpense;
      const balanceColor = balance >= 0 ? "#10B981" : "#EF4444";

      const rowsHtml = (items: Transaction[], color: string) =>
        items
          .map(
            (item) => `
          <tr>
            <td>${item.label}</td>
            <td style="text-align:right; color:${color};">${formatCurrency(item.value, currency)}</td>
          </tr>`,
          )
          .join("");

      return `
        <div class="section">
          <div class="currency-badge">${currency}</div>

          ${
            inc.length > 0
              ? `
          <p class="section-label incoming">Incomings</p>
          <table>
            ${rowsHtml(inc, "#10B981")}
          </table>`
              : ""
          }

          ${
            exp.length > 0
              ? `
          <p class="section-label expense">Expenses</p>
          <table>
            ${rowsHtml(exp, "#EF4444")}
          </table>`
              : ""
          }

          <div class="totals">
            <div class="total-row">
              <span>Total received</span>
              <span style="color:#10B981;">${formatCurrency(totalIncoming, currency)}</span>
            </div>
            <div class="total-row">
              <span>Total spent</span>
              <span style="color:#EF4444;">${formatCurrency(totalExpense, currency)}</span>
            </div>
            <div class="total-row balance">
              <span>Balance</span>
              <span style="color:${balanceColor};">${formatCurrency(balance, currency)}</span>
            </div>
          </div>
        </div>`;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <h1>${reference}</h1>
        <p class="generated">Generated by monthctrl · ${new Date().toLocaleDateString()}</p>
        ${sectionsHtml}
      </body>
    </html>`;
}

// ─── B: Export com filtros (list page) ───────────────────────────────────────

export function buildExportPdfHtml(
  data: DetailedTransaction[],
  filters: {
    referenceStart: string;
    referenceEnd: string;
    transactionType: TransactionType;
  },
): string {
  const references = Array.from(new Set(data.map((d) => d.reference))).sort(
    (a, b) => b.localeCompare(a),
  );

  const sectionsHtml = references
    .map((reference) => {
      const refRows = data.filter((d) => d.reference === reference);
      const currencies = Array.from(
        new Set(refRows.map((d) => d.currency)),
      ).sort();

      const currenciesHtml = currencies
        .map((currency) => {
          const rows = refRows.filter((d) => d.currency === currency);
          const incomings = rows.filter((d) => d.type === "incoming");
          const expenses = rows.filter((d) => d.type === "expense");

          const totalIncoming = incomings.reduce((s, r) => s + r.value, 0);
          const totalExpense = expenses.reduce((s, r) => s + r.value, 0);
          const balance = totalIncoming - totalExpense;

          const showIncoming = filters.transactionType !== "expense";
          const showExpense = filters.transactionType !== "incoming";
          const showBalance = filters.transactionType === "all";

          return `
  <div class="currency-section">
    <h3 class="currency-title">${currency}</h3>

    ${
      showIncoming && incomings.length > 0
        ? `
      <p class="section-label income-label">Incomings</p>
      <table>
        ${incomings
          .map(
            (r) => `
          <tr>
            <td>${r.description}</td>
            <td class="amount income">+ ${formatCurrency(r.value, currency)}</td>
          </tr>`,
          )
          .join("")}
        <tr class="subtotal">
          <td>Total Incomings</td>
          <td class="amount income">+ ${formatCurrency(totalIncoming, currency)}</td>
        </tr>
      </table>`
        : ""
    }

    ${
      showExpense && expenses.length > 0
        ? `
      <p class="section-label expense-label">Expenses</p>
      <table>
        ${expenses
          .map(
            (r) => `
          <tr>
            <td>${r.description}</td>
            <td class="amount expense">- ${formatCurrency(r.value, currency)}</td>
          </tr>`,
          )
          .join("")}
        <tr class="subtotal">
          <td>Total Expenses</td>
          <td class="amount expense">- ${formatCurrency(totalExpense, currency)}</td>
        </tr>
      </table>`
        : ""
    }

    ${
      showBalance
        ? `
      <table>
        <tr class="balance-row">
          <td>Balance</td>
          <td class="amount ${balance >= 0 ? "income" : "expense"}">${balance >= 0 ? "+" : ""} ${formatCurrency(Math.abs(balance), currency)}</td>
        </tr>
      </table>`
        : ""
    }
  </div>`;
        })
        .join("");

      return `
      <div class="reference-section">
        <h2 class="reference-title">${reference}</h2>
        ${currenciesHtml}
      </div>`;
    })
    .join("");

  const typeLabel =
    filters.transactionType === "all"
      ? "All transactions"
      : filters.transactionType === "incoming"
        ? "Incomings only"
        : "Expenses only";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${EXPORT_STYLES}</style>
</head>
<body>
  <h1>monthctrl — Export</h1>
  <p class="meta">${filters.referenceStart} → ${filters.referenceEnd} · ${typeLabel} · Generated ${new Date().toLocaleDateString()}</p>
  ${sectionsHtml}
  <p class="generated">Generated by monthctrl</p>
</body>
</html>`;
}

// ─── Utilitários de referência (mês/ano) ────────────────────────────────────

export function getReferencesInRange(start: string, end: string): string[] {
  const [startMonth, startYear] = parseReference(start);
  const [endMonth, endYear] = parseReference(end);

  const fromYear = Math.min(startYear, endYear);
  const fromMonth = startYear <= endYear ? startMonth : endMonth;
  const toYear = Math.max(startYear, endYear);
  const toMonth = startYear <= endYear ? endMonth : startMonth;

  const references: string[] = [];
  let month = fromMonth;
  let year = fromYear;

  while (year < toYear || (year === toYear && month <= toMonth)) {
    references.push(`${year}-${String(month).padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return references;
}

function parseReference(ref: string): [number, number] {
  const [year, month] = ref.split("-").map(Number);
  return [month, year];
}
