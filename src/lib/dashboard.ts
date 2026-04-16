import type {
  DashboardMetricKey,
  DashboardRangeKey,
  ExpenseRecord,
  InvoiceRecord,
  PaymentRecord,
  QuotationRecord,
} from "@/lib/billing";
import { computeCollectionRate, computeProfit, roundCurrency } from "@/lib/billing-utils";

export interface DashboardInvoiceRow extends InvoiceRecord {
  collectedAmount: number;
  outstandingAmount: number;
  expenseAmount: number;
  profitAmount: number;
  lastActivityAt: string;
  issuedInRange: boolean;
  dueInRange: boolean;
  hasPaymentInRange: boolean;
  collectedInRangeAmount: number;
  expenseInRangeAmount: number;
}

export interface DashboardMetrics {
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
  collectionRate: number | null;
}

export interface DashboardQuotationRow extends QuotationRecord {
  daysToExpiry: number | null;
  expiresSoon: boolean;
}

export interface DashboardClientInsight {
  clientId: string;
  clientName: string;
  company: string;
  billedTotal: number;
  collectedTotal: number;
  outstandingTotal: number;
  invoiceCount: number;
  href: string;
}

export interface DashboardAnalytics {
  totalBilled: number;
  totalCollected: number;
  totalExpenses: number;
  netProfit: number;
  averageInvoice: number;
}

export interface DashboardActivityItem {
  id: string;
  kind: "invoice" | "quotation" | "payment" | "expense";
  title: string;
  subtitle: string;
  href: string;
  date: string;
  amount?: number;
  currency?: string;
}

export interface DashboardInsights {
  analytics: DashboardAnalytics;
  followUpQueue: DashboardInvoiceRow[];
  pendingQuotations: DashboardQuotationRow[];
  topClients: DashboardClientInsight[];
  recentActivity: DashboardActivityItem[];
}

function toDateOnly(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function sum(values: number[]) {
  return roundCurrency(values.reduce((total, value) => total + value, 0));
}

function buildRangeStart(range: DashboardRangeKey, today: string) {
  if (range === "all") return null;

  const current = new Date(`${today}T00:00:00`);
  if (Number.isNaN(current.getTime())) return null;

  if (range === "30d") {
    current.setDate(current.getDate() - 29);
  } else if (range === "90d") {
    current.setDate(current.getDate() - 89);
  } else {
    current.setMonth(current.getMonth() - 11);
  }

  return current.toISOString().slice(0, 10);
}

export function isDateInDashboardRange(
  value: string | null | undefined,
  range: DashboardRangeKey,
  today: string,
) {
  if (range === "all") return Boolean(value);

  const dateOnly = toDateOnly(value);
  if (!dateOnly) return false;

  const rangeStart = buildRangeStart(range, today);
  if (!rangeStart) return false;

  return dateOnly >= rangeStart && dateOnly <= today;
}

function dayDifference(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null;
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

function pickLatestDate(...values: Array<string | null | undefined>) {
  const normalized = values
    .map((value) => toDateOnly(value) ?? value ?? null)
    .filter((value): value is string => Boolean(value));

  if (normalized.length === 0) return "";
  return normalized.sort((a, b) => a.localeCompare(b)).at(-1) ?? "";
}

export function buildDashboardInvoiceRows(params: {
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  range: DashboardRangeKey;
  today: string;
}): DashboardInvoiceRow[] {
  const { invoices, payments, expenses, range, today } = params;

  return invoices
    .filter((invoice) => invoice.status !== "draft")
    .map((invoice) => {
      const invoicePayments = payments.filter((payment) => payment.invoiceId === invoice.id);
      const invoiceExpenses = expenses.filter((expense) => expense.invoiceId === invoice.id);
      const collectedAmount = sum(invoicePayments.map((payment) => payment.amount));
      const collectedInRangeAmount = sum(
        invoicePayments
          .filter((payment) => isDateInDashboardRange(payment.datePaid, range, today))
          .map((payment) => payment.amount),
      );
      const expenseAmount = sum(invoiceExpenses.map((expense) => expense.amount));
      const expenseInRangeAmount = sum(
        invoiceExpenses
          .filter((expense) => isDateInDashboardRange(expense.date, range, today))
          .map((expense) => expense.amount),
      );
      const profit = computeProfit({ total: invoice.total, expensesTotal: expenseAmount }).profit;

      return {
        ...invoice,
        collectedAmount,
        outstandingAmount: roundCurrency(Math.max(0, invoice.total - collectedAmount)),
        expenseAmount,
        profitAmount: roundCurrency(profit),
        lastActivityAt: pickLatestDate(
          invoice.updatedAt,
          ...invoicePayments.map((payment) => payment.createdAt),
          ...invoiceExpenses.map((expense) => expense.createdAt),
        ),
        issuedInRange: isDateInDashboardRange(invoice.issueDate, range, today),
        dueInRange: isDateInDashboardRange(invoice.dueDate, range, today),
        hasPaymentInRange: collectedInRangeAmount > 0,
        collectedInRangeAmount,
        expenseInRangeAmount,
      };
    });
}

export function buildDashboardMetrics(rows: DashboardInvoiceRow[]): DashboardMetrics {
  const billedRows = rows.filter((row) => row.issuedInRange);
  const totalBilled = sum(billedRows.map((row) => row.total));
  const totalCollected = sum(rows.map((row) => row.collectedInRangeAmount));
  const outstanding = sum(billedRows.map((row) => row.outstandingAmount));
  const collectionRate = computeCollectionRate({
    totalBilled,
    totalCollected: sum(billedRows.map((row) => row.collectedInRangeAmount)),
  });

  return {
    totalBilled,
    totalCollected,
    outstanding,
    collectionRate,
  };
}

export function selectDashboardDrilldownRows(
  rows: DashboardInvoiceRow[],
  metric: DashboardMetricKey,
) {
  const billedRows = rows.filter((row) => row.issuedInRange);

  if (metric === "collected") {
    return rows
      .filter((row) => row.hasPaymentInRange)
      .sort(
        (a, b) =>
          b.collectedInRangeAmount - a.collectedInRangeAmount ||
          b.lastActivityAt.localeCompare(a.lastActivityAt),
      );
  }

  if (metric === "outstanding") {
    return billedRows
      .filter((row) => row.outstandingAmount > 0)
      .sort(
        (a, b) =>
          b.outstandingAmount - a.outstandingAmount ||
          a.dueDate.localeCompare(b.dueDate),
      );
  }

  if (metric === "collection-rate") {
    return billedRows.sort(
      (a, b) =>
        b.outstandingAmount - a.outstandingAmount ||
        b.collectedAmount - a.collectedAmount ||
        b.issueDate.localeCompare(a.issueDate),
    );
  }

  return billedRows.sort(
    (a, b) => b.issueDate.localeCompare(a.issueDate) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function buildDashboardInsights(params: {
  rows: DashboardInvoiceRow[];
  quotations: QuotationRecord[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  range: DashboardRangeKey;
  today: string;
}): DashboardInsights {
  const { rows, quotations, payments, expenses, range, today } = params;
  const relevantRows = rows.filter(
    (row) => range === "all" || row.issuedInRange || row.dueInRange || row.hasPaymentInRange,
  );
  const billedRows = rows.filter((row) => row.issuedInRange);
  const followUpQueue = relevantRows
    .filter(
      (row) =>
        row.outstandingAmount > 0 &&
        (row.status === "overdue" || row.status === "sent" || row.status === "partial_paid"),
    )
    .sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (a.status !== "overdue" && b.status === "overdue") return 1;
      return a.dueDate.localeCompare(b.dueDate) || b.outstandingAmount - a.outstandingAmount;
    })
    .slice(0, 6);

  const pendingQuotations = quotations
    .filter((quotation) => quotation.status === "sent")
    .filter(
      (quotation) =>
        range === "all" ||
        isDateInDashboardRange(quotation.quotationDate, range, today) ||
        isDateInDashboardRange(quotation.expiryDate, range, today),
    )
    .map((quotation) => {
      const daysToExpiry = dayDifference(today, quotation.expiryDate);
      return {
        ...quotation,
        daysToExpiry,
        expiresSoon: daysToExpiry !== null && daysToExpiry <= 7,
      };
    })
    .sort((a, b) => {
      const aDays = a.daysToExpiry ?? Number.MAX_SAFE_INTEGER;
      const bDays = b.daysToExpiry ?? Number.MAX_SAFE_INTEGER;
      return aDays - bDays || b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 5);

  const topClients = Array.from(
    billedRows.reduce((lookup, row) => {
      const current = lookup.get(row.client.id) ?? {
        clientId: row.client.id,
        clientName: row.client.name,
        company: row.client.company,
        billedTotal: 0,
        collectedTotal: 0,
        outstandingTotal: 0,
        invoiceCount: 0,
        href: `/app/clients/${row.client.slug}`,
      };

      current.billedTotal = roundCurrency(current.billedTotal + row.total);
      current.collectedTotal = roundCurrency(current.collectedTotal + row.collectedAmount);
      current.outstandingTotal = roundCurrency(current.outstandingTotal + row.outstandingAmount);
      current.invoiceCount += 1;
      lookup.set(row.client.id, current);
      return lookup;
    }, new Map<string, DashboardClientInsight>()),
  )
    .map(([, value]) => value)
    .sort(
      (a, b) =>
        b.outstandingTotal - a.outstandingTotal ||
        b.billedTotal - a.billedTotal ||
        a.clientName.localeCompare(b.clientName),
    )
    .slice(0, 5);

  const totalBilled = sum(billedRows.map((row) => row.total));
  const totalCollected = sum(rows.map((row) => row.collectedInRangeAmount));
  const totalExpenses = sum(
    expenses
      .filter((expense) => isDateInDashboardRange(expense.date, range, today))
      .map((expense) => expense.amount),
  );
  const netProfit = roundCurrency(totalCollected - totalExpenses);
  const averageInvoice = billedRows.length > 0 ? roundCurrency(totalBilled / billedRows.length) : 0;

  const rowLookup = new Map(rows.map((row) => [row.id, row]));
  const recentActivity = [
    ...rows
      .filter((row) => range === "all" || row.issuedInRange)
      .map<DashboardActivityItem>((row) => ({
        id: `invoice-${row.id}`,
        kind: "invoice",
        title: row.invoiceNumber,
        subtitle: `${row.client.name} created`,
        href: `/app/invoices/${row.slug}`,
        date: row.createdAt,
        amount: row.total,
        currency: row.currency,
      })),
    ...quotations
      .filter(
        (quotation) =>
          range === "all" || isDateInDashboardRange(quotation.quotationDate, range, today),
      )
      .map<DashboardActivityItem>((quotation) => ({
        id: `quotation-${quotation.id}`,
        kind: "quotation",
        title: quotation.quotationNumber,
        subtitle: `${quotation.client.name} quotation`,
        href: `/app/quotations/${quotation.slug}`,
        date: quotation.createdAt,
        amount: quotation.total,
        currency: quotation.currency,
      })),
    ...payments
      .filter((payment) => isDateInDashboardRange(payment.datePaid, range, today))
      .map<DashboardActivityItem>((payment) => {
        const row = rowLookup.get(payment.invoiceId);
        return {
          id: `payment-${payment.id}`,
          kind: "payment",
          title: row ? `Payment on ${row.invoiceNumber}` : "Payment recorded",
          subtitle: row ? row.client.name : "Invoice payment",
          href: row ? `/app/invoices/${row.slug}` : "/app/invoices",
          date: payment.createdAt,
          amount: payment.amount,
          currency: row?.currency,
        };
      }),
    ...expenses
      .filter((expense) => isDateInDashboardRange(expense.date, range, today))
      .map<DashboardActivityItem>((expense) => {
        const row = rowLookup.get(expense.invoiceId);
        return {
          id: `expense-${expense.id}`,
          kind: "expense",
          title: row ? `Expense on ${row.invoiceNumber}` : "Expense recorded",
          subtitle: expense.vendor || expense.description,
          href: row ? `/app/invoices/${row.slug}` : "/app/invoices",
          date: expense.createdAt,
          amount: expense.amount,
          currency: row?.currency,
        };
      }),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return {
    analytics: {
      totalBilled,
      totalCollected,
      totalExpenses,
      netProfit,
      averageInvoice,
    },
    followUpQueue,
    pendingQuotations,
    topClients,
    recentActivity,
  };
}

// ---------------------------------------------------------------------------
// Analytics computation functions (Plan 07-01)
// ---------------------------------------------------------------------------

export interface RevenueTrendMonth {
  month: string;    // "Jan", "Feb", ... display label
  monthKey: string; // "YYYY-MM" for data joining
  billed: number;
  collected: number;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export function buildRevenueTrend(
  rows: DashboardInvoiceRow[],
  payments: PaymentRecord[],
  today: string,
): RevenueTrendMonth[] {
  const base = new Date(`${today}T00:00:00`);

  const slots: RevenueTrendMonth[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(base);
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().slice(0, 7); // "YYYY-MM"
    const monthIndex = parseInt(monthKey.slice(5, 7), 10) - 1;
    const month = MONTH_LABELS[monthIndex] ?? monthKey;

    const billed = roundCurrency(
      rows
        .filter((row) => toDateOnly(row.issueDate)?.slice(0, 7) === monthKey)
        .reduce((acc, row) => acc + row.total, 0),
    );

    const collected = roundCurrency(
      payments
        .filter((payment) => payment.datePaid.slice(0, 7) === monthKey)
        .reduce((acc, payment) => acc + payment.amount, 0),
    );

    slots.push({ month, monthKey, billed, collected });
  }

  return slots;
}

export interface AgingBucket {
  label: string;  // "0-30d", "31-60d", "61-90d", "90+d"
  amount: number;
  count: number;
}

export function buildAgingBuckets(
  rows: DashboardInvoiceRow[],
  today: string,
): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { label: "0-30d", amount: 0, count: 0 },
    { label: "31-60d", amount: 0, count: 0 },
    { label: "61-90d", amount: 0, count: 0 },
    { label: "90+d", amount: 0, count: 0 },
  ];

  for (const row of rows) {
    if (row.outstandingAmount <= 0) continue;

    const daysRaw = dayDifference(row.dueDate, today);
    if (daysRaw === null) continue;

    const days = Math.max(0, daysRaw);

    let bucketIndex: number;
    if (days <= 30) {
      bucketIndex = 0;
    } else if (days <= 60) {
      bucketIndex = 1;
    } else if (days <= 90) {
      bucketIndex = 2;
    } else {
      bucketIndex = 3;
    }

    const bucket = buckets[bucketIndex];
    if (bucket) {
      bucket.amount = roundCurrency(bucket.amount + row.outstandingAmount);
      bucket.count += 1;
    }
  }

  return buckets;
}

export interface MomDeltas {
  totalBilled: number | null;
  totalCollected: number | null;
  outstanding: number | null;
  collectionRate: number | null; // percentage-point change
}

function filterRowsByPeriod(
  rows: DashboardInvoiceRow[],
  periodStart: string,
  periodEnd: string,
): DashboardInvoiceRow[] {
  return rows.filter((row) => {
    const issued = toDateOnly(row.issueDate);
    return issued !== null && issued >= periodStart && issued <= periodEnd;
  });
}

function computePeriodMetrics(filteredRows: DashboardInvoiceRow[]) {
  const totalBilled = roundCurrency(filteredRows.reduce((acc, r) => acc + r.total, 0));
  const totalCollected = roundCurrency(filteredRows.reduce((acc, r) => acc + r.collectedAmount, 0));
  const outstanding = roundCurrency(filteredRows.reduce((acc, r) => acc + r.outstandingAmount, 0));
  const collectionRate = computeCollectionRate({ totalBilled, totalCollected });
  return { totalBilled, totalCollected, outstanding, collectionRate };
}

export function buildMomDeltas(
  rows: DashboardInvoiceRow[],
  range: DashboardRangeKey,
  today: string,
): MomDeltas {
  if (range === "all") {
    return { totalBilled: null, totalCollected: null, outstanding: null, collectionRate: null };
  }

  // Compute current period window
  const currentEnd = today;
  const currentStart = buildRangeStart(range, today);
  if (!currentStart) {
    return { totalBilled: null, totalCollected: null, outstanding: null, collectionRate: null };
  }

  // Compute prior period window (same length, immediately before current)
  let priorEnd: string;
  let priorStart: string;

  if (range === "30d") {
    const priorEndDate = new Date(`${currentStart}T00:00:00`);
    priorEndDate.setDate(priorEndDate.getDate() - 1);
    priorEnd = priorEndDate.toISOString().slice(0, 10);
    const priorStartDate = new Date(`${priorEnd}T00:00:00`);
    priorStartDate.setDate(priorStartDate.getDate() - 29);
    priorStart = priorStartDate.toISOString().slice(0, 10);
  } else if (range === "90d") {
    const priorEndDate = new Date(`${currentStart}T00:00:00`);
    priorEndDate.setDate(priorEndDate.getDate() - 1);
    priorEnd = priorEndDate.toISOString().slice(0, 10);
    const priorStartDate = new Date(`${priorEnd}T00:00:00`);
    priorStartDate.setDate(priorStartDate.getDate() - 89);
    priorStart = priorStartDate.toISOString().slice(0, 10);
  } else {
    // "12m"
    const priorEndDate = new Date(`${currentStart}T00:00:00`);
    priorEndDate.setDate(priorEndDate.getDate() - 1);
    priorEnd = priorEndDate.toISOString().slice(0, 10);
    const priorStartDate = new Date(`${priorEnd}T00:00:00`);
    priorStartDate.setMonth(priorStartDate.getMonth() - 11);
    priorStart = priorStartDate.toISOString().slice(0, 10);
  }

  const currentRows = filterRowsByPeriod(rows, currentStart, currentEnd);
  const priorRows = filterRowsByPeriod(rows, priorStart, priorEnd);

  const current = computePeriodMetrics(currentRows);
  const prior = computePeriodMetrics(priorRows);

  const calcDelta = (curr: number, prev: number): number | null => {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / Math.abs(prev)) * 100 * 10) / 10;
  };

  const collectionRateDelta: number | null =
    current.collectionRate !== null && prior.collectionRate !== null
      ? Math.round((current.collectionRate - prior.collectionRate) * 10) / 10
      : null;

  return {
    totalBilled: calcDelta(current.totalBilled, prior.totalBilled),
    totalCollected: calcDelta(current.totalCollected, prior.totalCollected),
    outstanding: calcDelta(current.outstanding, prior.outstanding),
    collectionRate: collectionRateDelta,
  };
}
