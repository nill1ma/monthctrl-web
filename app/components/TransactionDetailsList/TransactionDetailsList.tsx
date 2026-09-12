import CardContainer from "@/app/components/card/card";
import CardItem from "@/app/components/card/cardItem";
import { DeleteForever, EditNote } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useIntl } from "react-intl";

interface Transaction {
  id: string;
  value: string | number | null;
  [key: string]: unknown;
}

interface TransactionListProps<T extends Transaction> {
  items: T[] | undefined;
  labelKey: keyof T;
  onDelete: (id: string) => void;
}

export function TransactionDetailsList<T extends Transaction>({
  items,
  labelKey,
  onDelete
}: TransactionListProps<T>) {
  const { formatMessage } = useIntl()
  const router = useRouter();
  const isIncoming = (items: string[]) => items.includes('origin') ? 'incomings' : 'expenses'
  return (
    <CardContainer className="border">
      {items?.map((item) => {
        const itemKeys = Object.keys(item);
        return (
          <CardItem
            key={`${item.id}`}
            label={item[labelKey] as string}
            value={item.value as string | number}
            className="justify-between"
            areaTextClassName="whitespace-nowrap overflow-scroll"
          >
            <div className="flex gap-1">
              <Tooltip title={formatMessage({ id: isIncoming(itemKeys) === 'incomings' ? "details.edit.incoming.tooltip" : "details.edit.expense.tooltip" })}>
                <EditNote onClick={() => router.push(`/edit/${isIncoming(itemKeys)}/${item.id}`)} className="cursor-pointer" />
              </Tooltip>
              <Tooltip title={formatMessage({ id: isIncoming(itemKeys) === 'incomings' ? "details.delete.incoming.tooltip" : "details.delete.expense.tooltip" })}>
                <DeleteForever onClick={() => onDelete(item.id)} className="cursor-pointer" />
              </Tooltip>
            </div>
          </CardItem>
        );
      })}
    </CardContainer>
  );
}