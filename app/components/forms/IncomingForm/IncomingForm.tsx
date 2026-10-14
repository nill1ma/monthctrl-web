
import Loading from "@/app/components/loading/loading";
import Button from "@/app/components/ui/Button/Button";
import Input from "@/app/components/ui/Input/Input";
import { useIncomings } from "@/app/hooks/useIncomings/useIncomings";
import { FormattedMessage, useIntl } from "react-intl";
import { z } from "zod";
import { useFormHandler } from "../useFormHandler";
import CommonFields from "../CommonFields/CommonFields";

function useIncomingSchema() {
  const { formatMessage } = useIntl();
  return z.object({
    origin: z.string().min(1, formatMessage({ id: "validation.required.origin" })),
    value: z.number().min(0, formatMessage({ id: "validation.positive.value" })),
    reference: z.string().min(1, formatMessage({ id: "validation.required.reference" })),
  });
}

export default function IncomingForm({ id, defaultValues, onSuccess }: { id?: string; defaultValues?: { origin: string; value: number; reference: string }; onSuccess?: () => void }) {
  const { formatMessage } = useIntl()
  const incomingSchema = useIncomingSchema();
  const { createMutation, isCreating, updateMutation, isUpdating } = useIncomings()
  const { register, handleSubmit, getErrorMessage } = useFormHandler(
      incomingSchema,
      async (data: z.infer<typeof incomingSchema>) => {
        if (id) {
          updateMutation({ id, ...data })
        } else {
          createMutation(data)
        }
        onSuccess?.()
      },
      { defaultValues },
    )

  return (
    <form onSubmit={handleSubmit} className="form">
      
      <Input label={formatMessage({ id: "create.update.incomings.origin" })} id="origin" className="input" {...register("origin")} />
      {getErrorMessage("origin") && <span>{getErrorMessage("origin")}</span>}
      
      <CommonFields register={register} getErrorMessage={getErrorMessage} />
      
      <Button className="button" variant="primary" type="submit" disabled={isCreating || isUpdating}>
        {(isCreating || isUpdating) ? <Loading /> : <FormattedMessage id="create.update.submit" />}
      </Button>
    </form>
  )
}