import React from "react";
import * as Table from "@/app/components/ui/table/Table";
import ReferenceDate from "../../../components/referenceDate/ReferenceDate";

type Row = Record<string, unknown> & { reference: string };

export default function CellContent({ column, item, className }: { column: { key: string; label: string }; item: Row; className?: string }) {
  return (
    <Table.TableCell key={column.key} className={className}>
      {column.key === "reference" ? (
        <ReferenceDate reference={item.reference} format="short" />
      ) : (
        item[column.key] as React.ReactNode
      )}
    </Table.TableCell>
  );
}
