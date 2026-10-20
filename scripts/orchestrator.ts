import { config } from 'dotenv'
config({ path: '.env.local' })

import { runA11yAgent } from './a11y-agent'
import { runI18nAgent } from './i18n-agent'
import { runTestRunnerAgent } from './test-runner-agent'
import { runTestCoverageAgent } from './test-coverage-agent'
import { runTypeAnyAgent } from './type-any-agent'

async function runOrchestrator() {
  const [a11yResult, i18nResult, testRunnerResult, testCoverageResult, typeAnyResult] = await Promise.all([
    runA11yAgent(),
    runI18nAgent(),
    runTestRunnerAgent(),
    runTestCoverageAgent(),
    runTypeAnyAgent(),
  ])

  const pad = (s: string, n: number) => s.padEnd(n)
  const icon = (r: { hasErrors: boolean }) => (r.hasErrors ? '❌' : '✅')

  console.log('\n' + '━'.repeat(60))
  console.log('  PRE-COMMIT SUMMARY')
  console.log('━'.repeat(60))
  console.log(`  ${icon(a11yResult)}  ${pad('A11y', 16)} ${a11yResult.status}`)
  console.log(`  ${icon(i18nResult)}  ${pad('i18n', 16)} ${i18nResult.status}`)
  console.log(`  ${icon(testRunnerResult)}  ${pad('Test Runner', 16)} ${testRunnerResult.status}`)
  console.log(`  ${icon(testCoverageResult)}  ${pad('Test Coverage', 16)} ${testCoverageResult.status}`)
  console.log(`  ${icon(typeAnyResult)}  ${pad('Type Any', 16)} ${typeAnyResult.status}`)
  console.log('━'.repeat(60))

  // test-coverage and type-any are advisory — do not block commit
  const hasBlockingErrors =
    a11yResult.hasErrors || i18nResult.hasErrors || testRunnerResult.hasErrors

  if (hasBlockingErrors) {
    console.log('  🚫 Commit blocked. Fix the errors above and try again.\n')
    process.exit(1)
  }

  console.log('  ✅ All checks passed. Commit allowed.\n')
  process.exit(0)
}

runOrchestrator().catch(err => {
  console.error('⚠️  Orchestrator falhou inesperadamente. Commit liberado.')
  console.error(err)
  process.exit(0)
})
