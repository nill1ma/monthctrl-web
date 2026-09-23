"use client";

import Loading from "@/app/components/loading/loading";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHeaderCell } from "@/app/components/ui/table/Table";
import { useIncomingsExpensesTransactionsList } from "@/app/hooks/useIncomingsExpensesTransactionsList/useIncomingsExpensesTransactionsList";
import { DownloadingSharp } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { redirect } from "next/navigation";
import CellContent from "./Components/CellComponent";
import "./styles.css";
import Pagination from "@/app/components/ui/Pagination/Pagination";
import { useState } from "react";

const PAGE_SIZE = 2; // precisa bater com o PAGE_SIZE do service

export default function List() {
  const columns = [
    { key: "reference", label: "Reference" },
    { key: "incoming_value", label: "Incomings" },
    { key: "expense_value", label: "Expenses" },
    { key: "net_income", label: "Net Income" },
    { key: "actions", label: "Actions" },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const { data: dataIncomingsExpenses, isLoading } = useIncomingsExpensesTransactionsList(currentPage);

  if (isLoading) {
    return <Loading />;
  }

  if (dataIncomingsExpenses && dataIncomingsExpenses.totalElements === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        No data
      </div>
    );
  }

  const totalPages = Math.ceil((dataIncomingsExpenses?.totalElements ?? 0) / PAGE_SIZE);

  return (
    <>
      <Table className="table">
        <TableHeader className="table-header">
          <TableRow className="table-row">
            {columns.map((column) => (
              <TableHeaderCell key={column.key} className="table-cell">
                {column.label}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataIncomingsExpenses?.data?.map((item) => (
            <TableRow
              onClick={() => redirect(`/details/${encodeURIComponent(item.reference)}`)}
              key={item.reference}
              className="table-row"
            >
              {columns.map((column) => (
                column.key === 'actions' ? (
                  <TableCell key="actions" className="table-cell">
                    <Tooltip title={`Download ${item.reference}`} arrow placement="top">
                      <DownloadingSharp />
                    </Tooltip>
                  </TableCell>
                ) : (
                  <CellContent
                    column={column}
                    item={item}
                    className="table-cell"
                    key={column.key}
                  />
                )
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(newPage) => setCurrentPage(newPage)}
      />
    </>
  );
}