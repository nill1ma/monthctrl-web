// CommonFields.tsx
import Input from "@/app/components/ui/Input/Input";
import { useIntl } from "react-intl";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";

interface CommonFieldsProps<T extends FieldValues & { value: number; reference: string }> {
  register: UseFormRegister<T>;
  getErrorMessage: (fieldName: keyof T) => string | undefined;
}

export default function CommonFields<T extends FieldValues & { value: number; reference: string }>(
  { register, getErrorMessage }: CommonFieldsProps<T>
) {
  const { formatMessage } = useIntl();

  return (
    <div className="flex gap-4">
      <Input
        label={formatMessage({ id: "create.update.reference" })}
        id="reference"
        type="month"
        className="w-2xs"
        {...register("reference" as Path<T>)}
        onClick={(e) => {
          const input = e.target as HTMLInputElement;
          if ("showPicker" in input) {
            input.showPicker();
          }
        }}
      />
      {getErrorMessage("reference") && <span>{getErrorMessage("reference")}</span>}

      <Input
        label={formatMessage({ id: "create.update.value" })}
        id="value"
        type="number"
        className="w-2xs"
        {...register("value" as Path<T>, { valueAsNumber: true })}
      />
      {getErrorMessage("value") && <span>{getErrorMessage("value")}</span>}
    </div>
  );
}