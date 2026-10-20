/**
 * Test Coverage Agent — identifica código crítico sem cobertura de testes e sugere casos.
 * Roda automaticamente no pre-commit via Husky (orchestrator).
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { readFile } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { existsSync } from 'fs'

const execAsync = promisify(exec)
const PROJECT_ROOT = process.cwd()

// ─── 1. Pega os arquivos .ts/.tsx staged (não-test) ──────────────────────────

async function getStagedSourceFiles(): Promise<string[]> {
  const { stdout } = await execAsync('git diff --cached --name-only --diff-filter=ACM')
  return stdout
    .trim()
    .split('\n')
    .filter(f =>
      f.length > 0 &&
      (f.endsWith('.ts') || f.endsWith('.tsx')) &&
      !f.endsWith('.spec.ts') &&
      !f.endsWith('.spec.tsx') &&
      !f.endsWith('.test.ts') &&
      !f.endsWith('.test.tsx') &&
      (f.startsWith('app/services/') || f.startsWith('app/hooks/') || f.startsWith('app/utils/') || f.startsWith('app/lib/'))
    )
}

// ─── 2. Verifica se existe arquivo de teste correspondente ───────────────────

function findTestFile(sourceFile: string): string | null {
  const base = sourceFile.replace(/\.(ts|tsx)$/, '')
  const candidates = [
    `${base}.spec.ts`,
    `${base}.spec.tsx`,
    `${base}.test.ts`,
    `${base}.test.tsx`,
    `${base.replace(/\/([^/]+)$/, '/__tests__/$1')}.spec.ts`,
    `${base.replace(/\/([^/]+)$/, '/__tests__/$1')}.test.ts`,
  ]
  return candidates.find(c => existsSync(path.join(PROJECT_ROOT, c))) ?? null
}

// ─── 3. Lê o conteúdo do arquivo fonte ───────────────────────────────────────

async function readSourceFile(filePath: string): Promise<string> {
  try {
    return await readFile(path.join(PROJECT_ROOT, filePath), 'utf-8')
  } catch {
    return ''
  }
}

// ─── 4. Lê o conteúdo do arquivo de teste existente (se houver) ──────────────

async function readTestFile(testFile: string): Promise<string> {
  try {
    return await readFile(path.join(PROJECT_ROOT, testFile), 'utf-8')
  } catch {
    return ''
  }
}

// ─── 5. Agent principal ───────────────────────────────────────────────────────

export async function runTestCoverageAgent(): Promise<{ hasErrors: boolean; status: string }> {
  const stagedFiles = await getStagedSourceFiles()

  if (stagedFiles.length === 0) {
    return { hasErrors: false, status: 'No logic files staged — skipped.' }
  }

  const uncoveredFiles: string[] = []
  const partialFiles: { file: string; testFile: string }[] = []

  const contextParts: string[] = []

  for (const file of stagedFiles) {
    const testFile = findTestFile(file)
    const sourceContent = await readSourceFile(file)

    if (!testFile) {
      uncoveredFiles.push(file)
      contextParts.push(`\n## ${file} (SEM TESTE)\n\`\`\`ts\n${sourceContent.slice(0, 3000)}\n\`\`\``)
    } else {
      const testContent = await readTestFile(testFile)
      partialFiles.push({ file, testFile })
      contextParts.push(`\n## ${file} (TESTE: ${testFile})\n### Fonte:\n\`\`\`ts\n${sourceContent.slice(0, 2000)}\n\`\`\`\n### Testes existentes:\n\`\`\`ts\n${testContent.slice(0, 2000)}\n\`\`\``)
    }
  }

  if (uncoveredFiles.length === 0 && partialFiles.length === 0) {
    return { hasErrors: false, status: `All ${stagedFiles.length} logic file(s) have corresponding tests.` }
  }

  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
  const { text } = await generateText({
    model: google('gemini-3.8-flash'),
    system: `Você é um engenheiro de software sênior especializado em testes em TypeScript/React com Jest.
Para cada arquivo analisado:
- Se não tem teste: identifique as funções/lógicas críticas e sugira os casos de teste mais importantes (edge cases, erros, caminhos alternativos).
- Se tem teste parcial: identifique o que está faltando comparando fonte e testes existentes.
Seja objetivo e prático. Mostre exemplos de código dos testes sugeridos quando relevante.
Responda em português.`,
    prompt: `Analise a cobertura de testes destes arquivos:\n${contextParts.join('\n')}`,
  })

  console.log('━'.repeat(60))
  console.log('🔍 RELATÓRIO DE COBERTURA DE TESTES')
  console.log('━'.repeat(60))
  console.log(text)
  console.log('━'.repeat(60))

  const missingMsg = uncoveredFiles.length > 0 ? `, ${uncoveredFiles.length} file(s) with no tests` : ''
  return { hasErrors: false, status: `Coverage report generated${missingMsg} — advisory only.` }
}
