"use client";

import CardContainer from "@/app/components/card/card";
import CardItem from "@/app/components/card/cardItem";
import { Dialog } from "@developmentsnil/awake-ui/dialog";
import { Button } from "@developmentsnil/awake-ui/button";
import { DeleteForever, EditNote } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useIntl } from "react-intl";
import { useState } from "react";

interface Transaction {
  id: string;
  value: string | number | null;
  currency?: string;
  [key: string]: unknown;
}

function formatValue(value: string | number | null, currency?: string): string {
  if (value === null || value === undefined) return "-";
  if (currency && typeof value === "number") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
  }
  return String(value);
}

interface TransactionListProps<T extends Transaction> {
  items: T[] | undefined;
  labelKey: keyof T;
  onDelete: (id: string) => void;
}

export function TransactionDetailsList<T extends Transaction>({
  items,
  labelKey,
  onDelete,
}: TransactionListProps<T>) {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isIncoming = (keys: string[]) => keys.includes("origin") ? "incomings" : "expenses";

  async function handleConfirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      onDelete(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <CardContainer className="border">
        {items?.map((item) => {
          const itemKeys = Object.keys(item);
          const type = isIncoming(itemKeys);
          return (
            <CardItem
              key={`${item.id}`}
              label={item[labelKey] as string}
              value={formatValue(item.value as string | number | null, item.currency as string | undefined)}
              className="justify-between"
              areaTextClassName="whitespace-nowrap overflow-scroll"
            >
              <div className="flex gap-1">
                <Tooltip title={formatMessage({ id: type === "incomings" ? "details.edit.incoming.tooltip" : "details.edit.expense.tooltip" })}>
                  <EditNote
                    onClick={() => router.push(`/edit/${type}/${item.id}`)}
                    className="cursor-pointer"
                  />
                </Tooltip>
                <Tooltip title={formatMessage({ id: type === "incomings" ? "details.delete.incoming.tooltip" : "details.delete.expense.tooltip" })}>
                  <DeleteForever
                    onClick={() => setDeletingId(item.id)}
                    className="cursor-pointer"
                  />
                </Tooltip>
              </div>
            </CardItem>
          );
        })}
      </CardContainer>

      <Dialog.Root open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
            <Dialog.Title className="text-lg font-semibold">
              Confirmar exclusão
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500">
              Este item será removido permanentemente. Esta ação não pode ser desfeita.
            </Dialog.Description>
            <div className="flex justify-end gap-3 mt-2">
              <Dialog.Close render={<Button variant="secondary">Cancelar</Button>} />
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                {isDeleting ? "Deletando..." : "Deletar"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
