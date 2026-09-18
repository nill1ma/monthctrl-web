"use client";

import Loading from "@/app/components/loading/loading";
import * as Table from "@/app/components/ui/table/Table";
import { useIncomingsExpensesTransactionsList } from "@/app/hooks/useIncomingsExpensesTransactionsList/useIncomingsExpensesTransactionsList";
import { DownloadingSharp } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { redirect } from "next/navigation";
import CellContent from "./Components/CellComponent";
import "./styles.css";

export default function List() {
  const columns = [
    { key: "reference", label: "Reference" },
    { key: "incoming_value", label: "Incomings" },
    { key: "expense_value", label: "Expenses" },
    { key: "net_income", label: "Net Income" },
    { key: "actions", label: "Actions" },
  ];

  const { data: dataIncomingsExpenses, isLoading } = useIncomingsExpensesTransactionsList();

  if (isLoading) {
    return <Loading />;
  }

  if (dataIncomingsExpenses && dataIncomingsExpenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        No data
      </div>
    );
  }

  return (
    <>
      <Table.Table className="table">
        <Table.TableHeader className="table-header">
          <Table.TableRow className="table-row">
            {columns.map((column) => (
              <Table.TableCell key={column.key} className="table-cell">
                {column.label}
              </Table.TableCell>
            ))}
          </Table.TableRow>
        </Table.TableHeader>
        <Table.TableBody>
          {dataIncomingsExpenses?.map((item) => (
            <Table.TableRow
              onClick={() => redirect(`/details/${encodeURIComponent(item.reference)}`)}
              key={item.id}
              className="table-row"
            >
              {columns.map((column) => (
                column.key === 'actions' ? (
                  <Table.TableCell key="actions" className="table-cell">
                    <Tooltip title={`Download ${item.reference}`} arrow placement="top">
                      <DownloadingSharp />
                    </Tooltip>
                  </Table.TableCell>
                ) : (
                  <CellContent
                    column={column}
                    item={item}
                    className="table-cell"
                    key={column.key}
                  />
                )
              ))}
            </Table.TableRow>
          ))}
        </Table.TableBody>
      </Table.Table>
    </>
  );
}
