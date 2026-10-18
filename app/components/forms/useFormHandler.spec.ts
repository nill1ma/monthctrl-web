import { renderHook, act } from '@testing-library/react'
import { z } from 'zod'
import { useFormHandler } from './useFormHandler'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  value: z.number().min(0, 'Value must be positive'),
})

type FormData = z.infer<typeof schema>

describe('useFormHandler', () => {
  it('returns register, handleSubmit, errors and getErrorMessage', () => {
    const { result } = renderHook(() =>
      useFormHandler(schema, async () => {})
    )
    expect(result.current.register).toBeDefined()
    expect(result.current.handleSubmit).toBeDefined()
    expect(result.current.errors).toBeDefined()
    expect(result.current.getErrorMessage).toBeDefined()
  })

  it('initializes with provided defaultValues', () => {
    const { result } = renderHook(() =>
      useFormHandler<FormData>(schema, async () => {}, {
        defaultValues: { name: 'Test', value: 42 },
      })
    )
    expect(result.current.errors).toEqual({})
  })

  it('getErrorMessage returns undefined when field has no error', () => {
    const { result } = renderHook(() =>
      useFormHandler(schema, async () => {})
    )
    expect(result.current.getErrorMessage('name')).toBeUndefined()
  })

  it('calls onSubmit with form data on valid submission', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useFormHandler<FormData>(schema, onSubmit, {
        defaultValues: { name: 'Salary', value: 1000 },
      })
    )

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent)
    })

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Salary', value: 1000 })
  })

  it('does not throw when onSubmit rejects', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('API error'))
    const { result } = renderHook(() =>
      useFormHandler<FormData>(schema, onSubmit, {
        defaultValues: { name: 'Test', value: 10 },
      })
    )

    await expect(
      act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })
    ).resolves.not.toThrow()
  })
})
