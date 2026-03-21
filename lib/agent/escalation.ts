// lib/agent/escalation.ts
// Nur eskalieren wenn das Modell klar sagt dass es die Frage NICHT beantworten kann
// Höfliche Abschlüsse wie "kontaktieren Sie" werden NICHT als Eskalation gewertet
const ESCALATION_KEYWORDS = [
  'steht nicht in den dokumenten',
  'steht leider nicht in den bereitgestellten',
  'kann ich nicht beantworten, da',
  'habe keine informationen dazu in den dokumenten',
  'ist nicht in den mir vorliegenden dokumenten',
  'keine relevanten informationen in den bereitgestellten',
]

export function shouldEscalate(response: string, hasContext: boolean): boolean {
  // Wenn wir Kontext hatten und geantwortet haben, nicht eskalieren
  if (hasContext) return false
  const lower = response.toLowerCase()
  return ESCALATION_KEYWORDS.some((kw) => lower.includes(kw))
}
