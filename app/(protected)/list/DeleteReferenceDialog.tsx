"use client";

import { Dialog } from "@developmentsnil/awake-ui/dialog";
import { Button } from "@developmentsnil/awake-ui/button";

interface Props {
  reference: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteReferenceDialog({ reference, open, onOpenChange, onConfirm, isDeleting }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
          <Dialog.Title className="text-lg font-semibold">
            Deletar {reference}?
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500">
            Todas as transações desta referência serão removidas permanentemente. Esta ação não pode ser desfeita.
          </Dialog.Description>
          <div className="flex justify-end gap-3 mt-2">
            <Dialog.Close render={<Button variant="secondary">Cancelar</Button>} />
            <Button
              variant="primary"
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              {isDeleting ? "Deletando..." : "Deletar"}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
