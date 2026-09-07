
import Loading from "@/app/components/loading/loading";
import Button from "@/app/components/ui/Button/Button";
import Input from "@/app/components/ui/Input/Input";
import { useIncomings } from "@/app/hooks/useIncomings/useIncomings";
import { FormattedMessage, useIntl } from "react-intl";
import { z } from "zod";
import { useFormHandler } from "../useFormHandler";
import CommonFields from "../CommonFields/CommonFields";

const incomingSchema = z.object({
  origin: z.string().min(1, "Origin is required"),
  value: z.number().min(0, "Value must be positive"),
  reference: z.string().min(1, "Reference is required"),
});

export default function IncomingForm({ id, defaultValues, onSuccess }: { id?: string; defaultValues?: z.infer<typeof incomingSchema>; onSuccess?: () => void }) {
  const { formatMessage } = useIntl()
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