import * as Table  from "@/app/components/ui/table/Table";
import { IncomingsExpensesTransaction } from "@/app/services//incomings_expenses_transactions/incomings_expenses_transactions.types";
import ReferenceDate from "../../../components/referenceDate/ReferenceDate";

export default function CellContent ({ column, item, className }: { column: { key: string; label: string }; item: IncomingsExpensesTransaction; className?: string }) {
    return <Table.TableCell key={column.key} className={className}>
        {column.key === 'reference' ? (
            <ReferenceDate reference={item[column.key as keyof typeof item] as string} format="short" />
        ) : (
            item[column.key as keyof typeof item]
        )}
    </Table.TableCell>
  }