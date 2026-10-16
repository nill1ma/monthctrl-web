import { config } from 'dotenv'
config({ path: '.env.local' })

import { runA11yAgent } from './a11y-agent'
import { runI18nAgent } from './i18n-agent'

async function runOrchestrator() {
  console.log('\n🤖 Orchestrator iniciado...\n')

  const [a11yResult] = await Promise.all([
    runA11yAgent(),
    runI18nAgent(),
  ])

  if (a11yResult.hasErrors) {
    process.exit(1)
  }

  process.exit(0)
}

runOrchestrator().catch(err => {
  console.error('⚠️  Orchestrator falhou. Commit liberado.')
  process.exit(0)
})