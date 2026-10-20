"use client";

import Loading from "@/app/components/loading/loading";
import { TransactionDetailsList } from "@/app/components/TransactionDetailsList/TransactionDetailsList";
import { useExpenses } from "@/app/hooks/useExpenses/useExpenses";
import { useTransactionCharts } from "@/app/hooks/useExpenses/useTransactionCharts/useTransactionCharts";
import { useIncomings } from "@/app/hooks/useIncomings/useIncomings";
import { useExportPdf } from "@/app/hooks/useExportPdf/useExportPdf";
import { Button } from "@developmentsnil/awake-ui/button";
import { ArrowCircleLeft, FileDownload } from "@mui/icons-material";
import { CircularProgress, Tooltip } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { FormattedMessage, useIntl } from "react-intl";
import ReferenceDate from "../../../components/referenceDate/ReferenceDate";
import "./styles.css";

function getCurrencyFlag(currency: string): string {
  const flags: Record<string, string> = {
    BRL: "🇧🇷",
    USD: "🇺🇸",
    CAD: "🇨🇦",
    EUR: "🇪🇺",
    GBP: "🇬🇧",
  };
  return flags[currency] ?? "💱";
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

export default function Details() {
  const params = useParams();
  const reference = decodeURIComponent(params.reference as string);
  const { formatMessage } = useIntl();
  const router = useRouter();

  const { data: dataIncomings, isLoading: isLoadingIncomings, deleteMutation: deleteIncomingMutation } = useIncomings(reference);
  const { data: dataExpenses, isLoading: isLoadingExpenses, deleteMutation: deleteExpenseMutation } = useExpenses(reference);
  const { currencyGroups } = useTransactionCharts(dataIncomings, dataExpenses);

  const { exportPdf, isExporting } = useExportPdf({
    reference,
    incomings: (dataIncomings ?? []).map((item) => ({
      label: item.origin,
      value: item.value ?? 0,
      currency: item.currency ?? "BRL",
    })),
    expenses: (dataExpenses ?? []).map((item) => ({
      label: item.destination,
      value: item.value ?? 0,
      currency: item.currency ?? "BRL",
    })),
  });

  if (isLoadingIncomings || isLoadingExpenses) {
    return <Loading />;
  }

  // Moedas que aparecem nos incomings
  const incomingCurrencies = [...new Set((dataIncomings ?? []).map((i) => i.currency ?? "BRL"))];
  // Moedas que aparecem nos expenses
  const expenseCurrencies = [...new Set((dataExpenses ?? []).map((e) => e.currency ?? "BRL"))];
  // Todas as moedas únicas
  const allCurrencies = [...new Set([...incomingCurrencies, ...expenseCurrencies])];

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <Tooltip title={`${formatMessage({ id: "details.goBack.button.tooltip" })}`} arrow placement="top">
          <Button variant="secondary" onClick={() => router.push("/list")} className="border flex gap-1">
            <ArrowCircleLeft className="cursor-pointer" />
            <FormattedMessage id="details.goBack.button" />
          </Button>
        </Tooltip>

        <Tooltip title={formatMessage({ id: "details.export.label" })} arrow placement="top">
          <Button
            variant="secondary"
            onClick={exportPdf}
            disabled={isExporting}
            className="border flex gap-1"
          >
            {isExporting ? (
              <CircularProgress size={18} />
            ) : (
              <FileDownload fontSize="small" />
            )}
            <FormattedMessage id="details.export.button" />
          </Button>
        </Tooltip>
      </div>

      <h3>
        <ReferenceDate reference={reference} />
      </h3>

      {/* Resumo por moeda */}
      {currencyGroups.length > 0 && (
        <div className="flex flex-wrap gap-3 my-4">
          {currencyGroups.map((group) => (
            <div key={group.currency} className="border rounded-lg p-4 flex flex-col gap-1 min-w-48">
              <span className="text-sm font-semibold text-gray-500">
                {getCurrencyFlag(group.currency)} {group.currency}
              </span>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500"><FormattedMessage id="details.incomings" /></span>
                <span className="text-emerald-600 font-medium">{formatCurrency(group.incomings, group.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500"><FormattedMessage id="details.expenses" /></span>
                <span className="text-red-500 font-medium">{formatCurrency(group.expenses, group.currency)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-1 mt-1">
                <span className="text-gray-700 font-medium"><FormattedMessage id="details.net" /></span>
                <span className={`font-semibold ${group.netIncome >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatCurrency(group.netIncome, group.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Listas agrupadas por moeda */}
      <div className="flex flex-col gap-7">
        {allCurrencies.map((currency) => {
          const incomingsForCurrency = (dataIncomings ?? []).filter((i) => (i.currency ?? "BRL") === currency);
          const expensesForCurrency = (dataExpenses ?? []).filter((e) => (e.currency ?? "BRL") === currency);

          return (
            <div key={currency} className="flex gap-2 w-full">
                {incomingsForCurrency.length > 0 && (
                  <div className="flex-1">
                    <h3 className="mb-1"><FormattedMessage id="details.incomings" /> {getCurrencyFlag(currency)} {currency}</h3>
                    <div className="h-full border">
                      <TransactionDetailsList
                        items={incomingsForCurrency}
                        labelKey={"origin"}
                        onDelete={deleteIncomingMutation}
                      />
                    </div>
                  </div>
                )}
                {expensesForCurrency.length > 0 && (
                  <div className="flex-1">
                    <h3 className="mb-1"><FormattedMessage id="details.expenses" /> {getCurrencyFlag(currency)} {currency}</h3>
                    <div className="h-full border">
                      <TransactionDetailsList
                        items={expensesForCurrency}
                        labelKey={"destination"}
                        onDelete={deleteExpenseMutation}
                      />
                    </div>
                  </div>
                )}
              </div>
          );
        })}
      </div>
    </>
  );
}
