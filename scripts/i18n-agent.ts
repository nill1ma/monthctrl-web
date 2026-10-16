/**
 * i18n Agent — detecta strings hardcoded visíveis em JSX nos arquivos staged
 * Roda automaticamente no pre-commit via Husky. Nunca bloqueia o commit.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
const PROJECT_ROOT = process.cwd()

// ─── 1. Pega os arquivos .tsx staged ─────────────────────────────────────────

async function getStagedFiles(): Promise<string[]> {
  const { stdout } = await execAsync('git diff --cached --name-only --diff-filter=ACM')
  return stdout
    .trim()
    .split('\n')
    .filter(f =>
      f.length > 0 &&
      (f.endsWith('.tsx') || f.endsWith('.jsx')) &&
      f.startsWith('app/') &&
      !f.startsWith('app/i18n/')
    )
}

// ─── 2. Lê o conteúdo completo dos arquivos ───────────────────────────────────

async function readFiles(files: string[]): Promise<{ file: string; content: string }[]> {
  const results = []
  for (const file of files) {
    try {
      const content = await readFile(path.join(PROJECT_ROOT, file), 'utf-8')
      results.push({ file, content })
    } catch {
      // ignora arquivos que não conseguiu ler
    }
  }
  return results
}

// ─── 3. Agent principal ───────────────────────────────────────────────────────

async function runI18nAgent() {
  console.log('\n🌐 i18n Agent iniciado...\n')

  const stagedFiles = await getStagedFiles()

  if (stagedFiles.length === 0) {
    console.log('✅ Nenhum componente React no staged — nada a verificar.\n')
    process.exit(0)
  }

  console.log(`📂 Componentes staged: ${stagedFiles.join(', ')}\n`)

  const filesContent = await readFiles(stagedFiles)

  if (filesContent.length === 0) {
    process.exit(0)
  }

  const context = filesContent
    .map(({ file, content }) => `## ${file}\n\`\`\`tsx\n${content}\n\`\`\``)
    .join('\n\n')

  console.log('⏳ Analisando strings com IA...\n')

  const { text } = await generateText({
    model: google('gemini-1.5-flash'),
    system: `Você é um especialista em internacionalização (i18n) de aplicações React com react-intl.

Analise os componentes abaixo e identifique strings hardcoded visíveis ao usuário que deveriam estar nos arquivos de tradução.

DEVE reportar:
- Texto literal entre tags JSX: <p>Texto aqui</p>
- Atributos visíveis com valor literal: placeholder="Digite aqui", aria-label="Fechar", alt="Logo da empresa", title="Configurações"
- Mensagens em template literals visíveis ao usuário

NÃO deve reportar:
- Chaves de tradução já existentes: formatMessage({ id: "..." }) ou <FormattedMessage id="..." />
- Class names, IDs, URLs, rotas
- Valores técnicos: type="button", variant="primary", href="/login"
- Strings vazias ou apenas espaços
- Comentários de código
- Nomes de variáveis ou props internas

Para cada string encontrada, informe:
- Arquivo e linha aproximada
- O trecho de código com a string
- Sugestão de chave de tradução no formato kebab-case (ex: "login.form.submit.button")

Se não encontrar nenhuma string hardcoded, diga claramente que está tudo ok.
Responda em português. Seja direto e objetivo.`,
    prompt: `Analise estes componentes em busca de strings hardcoded:\n\n${context}`,
  })

  console.log('━'.repeat(60))
  console.log('🌐 RELATÓRIO DE STRINGS HARDCODED (i18n)')
  console.log('━'.repeat(60))
  console.log(text)
  console.log('━'.repeat(60))
  console.log('\n⚠️  Nenhum arquivo foi alterado. Revise as strings acima com o time de produto.\n')

  // Sempre exit 0 — nunca bloqueia o commit
  process.exit(0)
}

runI18nAgent().catch(err => {
  console.error('Erro no i18n Agent:', err)
  process.exit(0) // erro no agent não bloqueia o commit
})