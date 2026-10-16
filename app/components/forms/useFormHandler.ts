// app/components/forms/useFormHandler.ts
import { useForm, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

interface UseFormHandlerOptions<T extends FieldValues> {
  defaultValues?: Partial<T>
}

export function useFormHandler<T extends FieldValues>(
  schema: z.ZodType<T>,
  onSubmit: (data: T) => Promise<void>,
  options?: UseFormHandlerOptions<T>
) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<T>({
    // @ts-expect-error incompatibilidade conhecida entre zod v4 e @hookform/resolvers v5
    resolver: zodResolver(schema),
    // @ts-expect-error
    defaultValues: options?.defaultValues,
  })

  const handleFormSubmit = async (data: T) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  return {
    register,
    // @ts-expect-error
    handleSubmit: handleSubmit(handleFormSubmit),
    errors,
    getErrorMessage: (fieldName: keyof T) => {
      const error = errors[fieldName]
      return error?.message as string | undefined
    },
    watch,
  }
}