"use client";

import BarChartComponent from "@/app/components/Chart/BarChart/BarChart";
import Loading from "@/app/components/loading/loading";
import { TransactionDetailsList } from "@/app/components/TransactionDetailsList/TransactionDetailsList";
import { useExpenses } from "@/app/hooks/useExpenses/useExpenses";
import { useTransactionCharts } from "@/app/hooks/useExpenses/useTransactionCharts/useTransactionCharts";
import { useIncomings } from "@/app/hooks/useIncomings/useIncomings";
import { Button } from "@developmentsnil/awake-ui/button";
import { ArrowCircleLeft } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { FormattedMessage, useIntl } from "react-intl";
import ReferenceDate from "../../../components/referenceDate/ReferenceDate";
import "./styles.css";

export default function Details() {
  const params = useParams();
  const reference = decodeURIComponent(params.reference as string);
  const { formatMessage } = useIntl();
  const router = useRouter();

  const {data: dataIncomings, isLoading: isLoadingIncomings, deleteMutation: deleteIncomingMutation} = useIncomings(reference);
  const {data: dataExpenses, isLoading: isLoadingExpenses, deleteMutation: deleteExpenseMutation} = useExpenses(reference);
  const {incomingChartData, expenseChartData, netIncome} = useTransactionCharts(dataIncomings, dataExpenses);

  if (isLoadingIncomings || isLoadingExpenses) {
    return <Loading />;
  }

  return (
    <>
    <Tooltip title={`${formatMessage({ id: "details.goBack.button.tooltip" })}`} arrow placement="top">
      <Button variant="secondary" onClick={() => router.push("/list")} className="border flex gap-1 mb-2">
        <ArrowCircleLeft
          className="cursor-pointer"
        />
        <FormattedMessage id="details.goBack.button" />
      </Button>
    </Tooltip>
      <h3>
        <ReferenceDate reference={reference} />
      </h3>
      <div className="flex flex-col h-full border gap-7">
        <article className="flex gap-2 w-full">
          <div className="p-0 w-125">
            <h3>
              <FormattedMessage id="details.incomings" />
            </h3>
            <div className="h-full border">
              <TransactionDetailsList items={dataIncomings} labelKey={"origin"} onDelete={deleteIncomingMutation} />
            </div>
          </div>

          <div className="p-0 w-125">
            <h3>
              <FormattedMessage id="details.expenses" />
            </h3>
            <div className="h-full border">
              <TransactionDetailsList items={dataExpenses} labelKey={"destination"} onDelete={deleteExpenseMutation} />
            </div>
          </div>
        </article>
        <BarChartComponent
          id="details"
          dataAxis={["Incomings", "Expenses", "Net Income"]}
          data={[incomingChartData, expenseChartData, netIncome]}
          className="w-25 "
        />
      </div>
    </>
  );
}