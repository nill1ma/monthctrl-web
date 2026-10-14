"use client";

import { Dialog } from "@developmentsnil/awake-ui/dialog";
import { Button } from "@developmentsnil/awake-ui/button";
import { useIntl } from "react-intl";

interface Props {
  reference: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteReferenceDialog({ reference, open, onOpenChange, onConfirm, isDeleting }: Props) {
  const { formatMessage } = useIntl();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
          <Dialog.Title className="text-lg font-semibold">
            {formatMessage({ id: "delete.dialog.title" })} — {reference}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500">
            {formatMessage({ id: "delete.dialog.description" })}
          </Dialog.Description>
          <div className="flex justify-end gap-3 mt-2">
            <Dialog.Close render={<Button variant="secondary">{formatMessage({ id: "delete.dialog.cancel" })}</Button>} />
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting
                ? formatMessage({ id: "delete.dialog.confirm.loading" })
                : formatMessage({ id: "delete.dialog.confirm" })}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
