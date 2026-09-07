"use client";

import Loading from "@/app/components/loading/loading";
import { useExpenses } from "@/app/hooks/useExpenses/useExpenses";
import { FormattedMessage, useIntl } from "react-intl";
import { z } from "zod";
import Button from "../../ui/Button/Button";
import Input from "../../ui/Input/Input";
import { useFormHandler } from "../useFormHandler";
import CommonFields from "../CommonFields/CommonFields";

const expenseSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  value: z.number().min(0, "Value must be positive"),
  reference: z.string().min(1, "Reference is required"),
});

export default function ExpenseForm({
  id,
  defaultValues,
  onSuccess,
}: {
  id?: string;
  defaultValues?: z.infer<typeof expenseSchema>;
  onSuccess?: () => void;
}) {
  const { formatMessage } = useIntl();
  const {
    createMutation,
    isCreating,
    updateMutation,
    isUpdating,
  } = useExpenses();
  const { register, handleSubmit, getErrorMessage } = useFormHandler(
    expenseSchema,
    async (data: z.infer<typeof expenseSchema>) => {
      if (id) {
        updateMutation({ id, ...data });
      } else {
        createMutation(data);
      }
      onSuccess?.();
    },
    { defaultValues }
  );

  return (
    <form onSubmit={handleSubmit} className="form">
      <Input
        label={formatMessage({ id: "create.update.expenses.destination" })}
        id="destination"
        {...register("destination")}
        className="input"
      />
      {getErrorMessage("destination") && (
        <span>{getErrorMessage("destination")}</span>
      )}

      <CommonFields register={register} getErrorMessage={getErrorMessage} />

      <Button
        className="button"
        variant="primary"
        type="submit"
        disabled={isCreating}
      >
        {(isCreating || isUpdating) ? (
          <Loading />
        ) : (
          <FormattedMessage id="create.update.submit" />
        )}
      </Button>
    </form>
  );
}