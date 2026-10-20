/**
 * Type-Any Agent — detecta uso de `any` explícito nos arquivos staged e sugere correções via IA
 * Roda automaticamente no pre-commit via Husky.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
const PROJECT_ROOT = process.cwd()

// ─── 1. Pega os arquivos .ts/.tsx staged no git ───────────────────────────────

async function getStagedFiles(): Promise<string[]> {
  const { stdout } = await execAsync('git diff --cached --name-only --diff-filter=ACM')
  return stdout
    .trim()
    .split('\n')
    .filter(f =>
      f.length > 0 &&
      (f.endsWith('.ts') || f.endsWith('.tsx')) &&
      !f.startsWith('scripts/') &&
      !f.startsWith('coverage/')
    )
}

// ─── 2. Tipos de ocorrência de `any` ─────────────────────────────────────────

interface AnyOccurrence {
  line: number
  column: number
  code: string
}

// ─── 3. Detecta `any` explícito no arquivo ───────────────────────────────────

const ANY_PATTERN = /\bany\b/g

// Regex para identificar contextos onde `any` NÃO é uma anotação de tipo
// (ex: comentários, strings, nomes de variável como `anyValue`)
function findExplicitAny(content: string): AnyOccurrence[] {
  const lines = content.split('\n')
  const occurrences: AnyOccurrence[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Ignora linhas de comentário
    const trimmed = line.trimStart()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue

    let match: RegExpExecArray | null
    ANY_PATTERN.lastIndex = 0

    while ((match = ANY_PATTERN.exec(line)) !== null) {
      const col = match.index

      // Garante que é um `any` de anotação de tipo, não parte de outro identificador
      const before = col > 0 ? line[col - 1] : ' '
      const after = col + 3 < line.length ? line[col + 3] : ' '
      const isIdentifier = /\w/.test(before) || /\w/.test(after)
      if (isIdentifier) continue

      // Ignora `any` dentro de strings
      const beforeStr = line.slice(0, col)
      const singleQuotes = (beforeStr.match(/'/g) ?? []).length
      const doubleQuotes = (beforeStr.match(/"/g) ?? []).length
      const backticks = (beforeStr.match(/`/g) ?? []).length
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) continue

      occurrences.push({ line: i + 1, column: col + 1, code: line.trim() })
    }
  }

  return occurrences
}

// ─── 4. Lê trecho do arquivo ao redor da ocorrência ─────────────────────────

async function getSnippet(filePath: string, line: number): Promise<string> {
  try {
    const content = await readFile(filePath, 'utf-8')
    const lines = content.split('\n')
    const start = Math.max(0, line - 4)
    const end = Math.min(lines.length, line + 3)
    return lines
      .slice(start, end)
      .map((l, i) => {
        const n = start + i + 1
        return `${n === line ? '>>>' : '   '} ${String(n).padStart(4)}: ${l}`
      })
      .join('\n')
  } catch {
    return '(não foi possível ler o arquivo)'
  }
}

// ─── 5. Lê o arquivo completo para contexto do LLM ───────────────────────────

async function getFileContent(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8')
  } catch {
    return '(não foi possível ler o arquivo)'
  }
}

// ─── 6. Monta o contexto para o LLM ──────────────────────────────────────────

interface FileAnyResult {
  relativePath: string
  filePath: string
  occurrences: AnyOccurrence[]
  fileContent: string
}

async function buildContext(results: FileAnyResult[]): Promise<string> {
  const parts: string[] = []

  for (const result of results) {
    parts.push(`\n## ${result.relativePath}`)
    parts.push(`\n**Conteúdo completo do arquivo:**\n\`\`\`typescript\n${result.fileContent}\n\`\`\``)
    parts.push(`\n**Ocorrências de \`any\` (${result.occurrences.length}):**`)

    for (const occ of result.occurrences) {
      const snippet = await getSnippet(result.filePath, occ.line)
      parts.push(`
📍 Linha ${occ.line}, coluna ${occ.column}
\`\`\`
${snippet}
\`\`\``)
    }
  }

  return parts.join('\n')
}

// ─── 7. Agent principal ───────────────────────────────────────────────────────

export async function runTypeAnyAgent(): Promise<{ hasErrors: boolean }> {
  console.log('\n🔍 Type-Any Agent iniciado...\n')

  const stagedFiles = await getStagedFiles()

  if (stagedFiles.length === 0) {
    console.log('✅ Nenhum arquivo TypeScript staged.')
    return { hasErrors: false }
  }

  // Detecta `any` em todos os arquivos staged
  const results: FileAnyResult[] = []

  for (const file of stagedFiles) {
    const filePath = path.join(PROJECT_ROOT, file)
    try {
      const content = await readFile(filePath, 'utf-8')
      const occurrences = findExplicitAny(content)

      if (occurrences.length > 0) {
        results.push({
          relativePath: file,
          filePath,
          occurrences,
          fileContent: content,
        })
      }
    } catch {
      // Arquivo pode não existir (ex: deletado)
    }
  }

  if (results.length === 0) {
    console.log('✅ Nenhum uso de `any` explícito encontrado.')
    return { hasErrors: false }
  }

  const totalOccurrences = results.reduce((a, r) => a + r.occurrences.length, 0)
  console.log(`⚠️  ${totalOccurrences} uso(s) de \`any\` em ${results.length} arquivo(s). Analisando com IA...`)

  const context = await buildContext(results)

  const { text } = await generateText({
    model: google('gemini-3.8-flash'),
    system: `Você é um especialista em TypeScript com foco em tipagem segura.
Analise os usos de \`any\` encontrados nos arquivos e sugira tipos TypeScript corretos para substituí-los.

Para cada ocorrência:
1. Explique brevemente por que \`any\` é problemático nesse contexto
2. Mostre o código **antes** e o código **depois** com o tipo correto sugerido
3. Se for uma situação complexa, explique o raciocínio por trás do tipo sugerido

Use o conteúdo completo do arquivo como contexto para inferir os tipos corretos.
Seja direto e prático. Responda em português. Use blocos de código formatados.`,
    prompt: `Analise estes usos de \`any\` e sugira correções:\n${context}`,
  })

  console.log('\n📋 Análise do Type-Any Agent:')
  console.log('─'.repeat(60))
  console.log(text)
  console.log('─'.repeat(60))
  console.log('\n⚠️  Corrija os usos de `any` antes de commitar (recomendado).')

  // Advisory: reporta mas não bloqueia o commit
  return { hasErrors: false }
}

runTypeAnyAgent().catch(err => {
  console.error(err)
  process.exit(1)
})
