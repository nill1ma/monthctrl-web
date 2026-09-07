import Input from "@/app/components/ui/Input/Input";
import { useIntl } from "react-intl";
import z from "zod";
import { UseFormRegister } from "react-hook-form";

interface CommonFieldsProps {
  register: UseFormRegister<{
    value: number;
    reference: string;
  }>
  
  getErrorMessage: (fieldName: keyof z.baseObjectOutputType<{
    value: z.ZodNumber;
    reference: z.ZodString;
  }>) => string | undefined
}


export default function CommonFields({ register, getErrorMessage }: CommonFieldsProps) {
  const { formatMessage } = useIntl();
  
  return (
    <div className="flex gap-4">
            <Input
              label={formatMessage({ id: "create.update.reference" })}
              id="reference"
              type="month"
              className="w-2xs"
              {...register("reference")}
              onClick={(e) => {
                const input = e.target as HTMLInputElement;
                if ("showPicker" in input) {
                  input.showPicker();
                }
              }}
            />
            {getErrorMessage("reference") && (
              <span>{getErrorMessage("reference")}</span>
            )}
    
            <Input
              label={formatMessage({ id: "create.update.value" })}
              id="value"
              type="number"
              className="w-2xs"
              {...register("value", { valueAsNumber: true })}
            />
            {getErrorMessage("value") && (
              <span>{getErrorMessage("value")}</span>
            )}
          </div>
  )
}