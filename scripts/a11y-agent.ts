/**
 * A11y Agent — analisa componentes React staged para violações WCAG via ESLint + IA
 * Roda automaticamente no pre-commit via Husky.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const PROJECT_ROOT = process.cwd()

// ─── 1. Pega os arquivos .tsx staged no git ───────────────────────────────────

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

// ─── 2. Roda ESLint com regras jsx-a11y nos arquivos staged ──────────────────

async function runA11yLint(files: string[]) {
  if (files.length === 0) return []
  const fileList = files.map(f => `"${f}"`).join(' ')
  let stdout = ''
  try {
    const result = await execAsync(
      `npx eslint ${fileList} --format json --rule '{"jsx-a11y/alt-text": "error", "jsx-a11y/aria-props": "error", "jsx-a11y/aria-role": "error", "jsx-a11y/interactive-supports-focus": "error", "jsx-a11y/click-events-have-key-events": "error", "jsx-a11y/no-noninteractive-element-interactions": "warn", "jsx-a11y/label-has-associated-control": "error", "jsx-a11y/anchor-is-valid": "error"}' --max-warnings=9999`,
      { cwd: PROJECT_ROOT }
    )
    stdout = result.stdout
  } catch (err: any) {
    if (err.stdout) stdout = err.stdout
    else throw new Error(`ESLint falhou: ${err.message}`)
  }
  const all = JSON.parse(stdout || '[]')
  return all.filter((r: any) => r.messages.length > 0)
}

// ─── 3. Lê trecho do arquivo ao redor da violação ────────────────────────────

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

// ─── 4. Monta contexto para o LLM ────────────────────────────────────────────

async function buildContext(lintResults: any[]) {
  const parts: string[] = []
  for (const file of lintResults) {
    const relativePath = path.relative(PROJECT_ROOT, file.filePath)
    parts.push(`\n## ${relativePath}`)
    for (const msg of file.messages) {
      const severity = msg.severity === 2 ? '🔴 ERRO' : '🟡 WARNING'
      const snippet = await getSnippet(file.filePath, msg.line)
      parts.push(`
${severity} linha ${msg.line} [${msg.ruleId}]
${msg.message}

\`\`\`tsx
${snippet}
\`\`\``)
    }
  }
  return parts.join('\n')
}

// ─── 5. Agent principal ───────────────────────────────────────────────────────

export async function runA11yAgent(): Promise<{ hasErrors: boolean }> {
  console.log('\n♿ A11y Agent iniciado...\n')

  const stagedFiles = await getStagedFiles()

  if (stagedFiles.length === 0) {
    console.log('✅ Nenhum componente React no staged — commit liberado.\n')
    return { hasErrors: false }
  }

  console.log(`📂 Componentes staged: ${stagedFiles.join(', ')}\n`)

  const lintResults = await runA11yLint(stagedFiles)

  if (lintResults.length === 0) {
    console.log('✅ Nenhuma violação de acessibilidade encontrada — commit liberado.\n')
    return { hasErrors: false }
  }

  const totalErrors = lintResults.reduce((a: number, r: any) => a + r.errorCount, 0)
  const totalWarnings = lintResults.reduce((a: number, r: any) => a + r.warningCount, 0)

  console.log(`⚠️  ${totalErrors} erro(s), ${totalWarnings} warning(s) de acessibilidade encontrados`)
  console.log('⏳ Analisando com IA...\n')

  const context = await buildContext(lintResults)

  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
  const { text } = await generateText({
    model: google('gemini-3.8-flash'),
    system: `Você é um especialista em acessibilidade web (WCAG 2.1 nível AA) e React/TypeScript.
Analise as violações de acessibilidade encontradas pelo ESLint e gere um relatório objetivo no terminal.
Para cada violação: explique qual diretriz WCAG é violada, por que é importante, e mostre o código corrigido (antes/depois).
Ao final: resumo do impacto para usuários com deficiência e prioridade de correção.
Use emojis e seja direto. Responda em português.`,
    prompt: `Analise estas violações de acessibilidade:\n${context}`,
  })

  console.log('━'.repeat(60))
  console.log('♿ RELATÓRIO DE ACESSIBILIDADE')
  console.log('━'.repeat(60))
  console.log(text)
  console.log('━'.repeat(60))

  if (totalErrors > 0) {
    console.log(`\n🚫 Commit bloqueado: ${totalErrors} erro(s) crítico(s) de acessibilidade.`)
    console.log('   Corrija os erros acima antes de commitar.\n')
    return { hasErrors: true }
  } else {
    console.log(`\n⚠️  Commit permitido com ${totalWarnings} warning(s). Considere corrigir em breve.\n`)
    return { hasErrors: false }
  }
}