import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/app/lib/supabase'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

/** Garante que a referência está no formato usado no banco (YYYY-MM).
 *  Aceita MM-YYYY (ex: 02-2027) e converte para YYYY-MM (ex: 2027-02).
 *  Se já estiver em YYYY-MM, retorna sem alteração. */
function normalizeReference(ref: string): string {
  const mmYYYY = ref.match(/^(\d{2})-(\d{4})$/)
  if (mmYYYY) return `${mmYYYY[2]}-${mmYYYY[1]}`
  return ref
}

export async function POST(req: Request) {
  const { messages: rawMessages } = await req.json()
  const messages = rawMessages.filter((m: { role: string; content: string }) =>
    !(m.role === "assistant" && m.content.trim() === "")
  )

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
Hoje é ${new Date().toLocaleDateString('pt-BR')}.

FORMATO DE REFERÊNCIA DE PERÍODO: YYYY-MM (ex: 2025-10, 2027-02).
O usuário pode também usar o formato nacional MM-YYYY (ex: 10-2025, 02-2027) — ambos são aceitos.
Quando o usuário mencionar um mês por extenso (ex: "Fevereiro de 2027", "março 2026", "jan/2025"),
converta SEMPRE para o formato YYYY-MM antes de chamar qualquer ferramenta.
Tabela de conversão:
Janeiro=01, Fevereiro=02, Março=03, Abril=04, Maio=05, Junho=06,
Julho=07, Agosto=08, Setembro=09, Outubro=10, Novembro=11, Dezembro=12.
Exemplos: "Fevereiro de 2027" → "2027-02" | "março 2026" → "2026-03" | "out/2025" → "2025-10".`,
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
        description: 'Busca todas as despesas de um período específico.',
        parameters: z.object({
          reference: z.string().describe('Período no formato YYYY-MM, ex: 2025-10'),
        }),
        execute: async ({ reference }) => {
          const normalized = normalizeReference(reference)
          const { data, error } = await supabase
            .from('expenses')
            .select('id, destination, value, currency')
            .eq('reference', normalized)
            .eq('user_id', user.id)
          if (error) return { error: error.message }
          return { reference: normalized, expenses: data ?? [] }
        },
      }),

      getIncomingsByPeriod: tool({
        description: 'Busca todas as receitas de um período específico.',
        parameters: z.object({
          reference: z.string().describe('Período no formato YYYY-MM, ex: 2025-10'),
        }),
        execute: async ({ reference }) => {
          const normalized = normalizeReference(reference)
          const { data, error } = await supabase
            .from('incomings')
            .select('id, origin, value, currency')
            .eq('reference', normalized)
            .eq('user_id', user.id)
          if (error) return { error: error.message }
          return { reference: normalized, incomings: data ?? [] }
        },
      }),
    },
    maxSteps: 5,
    onFinish: ({ text, toolCalls, toolResults, finishReason }) => {
      console.log("[chat] finishReason:", finishReason)
      console.log("[chat] text length:", text.length)
      console.log("[chat] toolCalls:", JSON.stringify(toolCalls?.map(t => ({ name: t.toolName, args: t.args }))))
      console.log("[chat] toolResults:", JSON.stringify(toolResults?.map(t => ({ name: t.toolName, result: t.result }))))
    },
  })

  return result.toTextStreamResponse()
}
