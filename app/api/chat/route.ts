import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/app/lib/supabase'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response('Não autorizado', { status: 401 })
  }

  const result = streamText({
    model: google('gemini-3.8-flash'),
    system: `Você é um assistente financeiro pessoal. Ajude o usuário a entender suas finanças
com base nos dados reais das suas receitas e despesas. Seja direto, claro e use formatação
simples. Quando mencionar valores, use o formato da moeda correspondente.
O formato de referência de período é MM-YYYY (ex: 10-2025).
Hoje é ${new Date().toLocaleDateString('pt-BR')}.`,
    messages,
    tools: {
      getAllPeriods: tool({
        description: 'Lista todos os períodos (meses) que o usuário tem registros financeiros.',
        parameters: z.object({}),
        execute: async () => {
          const [expensesRes, incomingsRes] = await Promise.all([
            supabase.from('expenses').select('reference').eq('user_id', user.id),
            supabase.from('incomings').select('reference').eq('user_id', user.id),
          ])
          const references = new Set([
            ...(expensesRes.data ?? []).map(e => e.reference),
            ...(incomingsRes.data ?? []).map(i => i.reference),
          ])
          return { periods: Array.from(references).sort() }
        },
      }),

      getExpensesByPeriod: tool({
        description: 'Busca todas as despesas de um período específico no formato MM-YYYY.',
        parameters: z.object({
          reference: z.string().describe('Período no formato MM-YYYY, ex: 10-2025'),
        }),
        execute: async ({ reference }) => {
          const { data, error } = await supabase
            .from('expenses')
            .select('id, destination, value, currency')
            .eq('reference', reference)
            .eq('user_id', user.id)
          if (error) return { error: error.message }
          return { reference, expenses: data ?? [] }
        },
      }),

      getIncomingsByPeriod: tool({
        description: 'Busca todas as receitas de um período específico no formato MM-YYYY.',
        parameters: z.object({
          reference: z.string().describe('Período no formato MM-YYYY, ex: 10-2025'),
        }),
        execute: async ({ reference }) => {
          const { data, error } = await supabase
            .from('incomings')
            .select('id, origin, value, currency')
            .eq('reference', reference)
            .eq('user_id', user.id)
          if (error) return { error: error.message }
          return { reference, incomings: data ?? [] }
        },
      }),
    },
    maxSteps: 5,
  })

  return result.toTextStreamResponse()
}
