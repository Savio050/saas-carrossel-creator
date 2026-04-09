/**
 * Utilitários compartilhados entre todas as rotas de geração de carrossel.
 *
 * - fetchSearchContext : faz uma busca no Google via Serper API e retorna
 *   um bloco de texto com fatos reais para ancorar a geração do Gemini.
 * - repairJson         : sanitiza o texto bruto do Gemini antes do JSON.parse,
 *   escapando newlines/tabs literais dentro de strings JSON.
 */

// ── Serper: busca de contexto real ─────────────────────────────────────────

interface SerperOrganicResult {
  title: string;
  snippet: string;
  link: string;
  date?: string;
}

interface SerperResponse {
  answerBox?: { answer?: string; snippet?: string; title?: string };
  knowledgeGraph?: { description?: string; title?: string };
  organic?: SerperOrganicResult[];
  topStories?: { title: string; snippet?: string; date?: string }[];
}

/**
 * Busca fatos reais sobre `tema` via Serper API.
 * Retorna string formatada para injetar no prompt do Gemini.
 * Se a busca falhar por qualquer motivo, retorna string vazia
 * (não deve bloquear a geração).
 */
export async function fetchSearchContext(tema: string): Promise<string> {
  // Chave via env (preferencial) ou fallback hardcoded para uso imediato.
  // Em produção, defina SERPER_API_KEY no .env.local
  const apiKey = process.env.SERPER_API_KEY || 'a105057f3fd327948f1aa3784f256646f01cf3fd';

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: tema,
        num: 6,
        hl: 'pt',
        gl: 'br',
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return '';

    const data: SerperResponse = await res.json();
    const linhas: string[] = [];

    // Resposta direta / answer box (ex: placar, definição)
    const resposta = data.answerBox?.answer || data.answerBox?.snippet;
    if (resposta) linhas.push(`Resposta direta: ${resposta}`);

    // Knowledge graph (ex: info de clube, jogador)
    if (data.knowledgeGraph?.description) {
      linhas.push(`Contexto: ${data.knowledgeGraph.description}`);
    }

    // Top stories (notícias recentes — especialmente útil para futebol/política)
    (data.topStories || []).slice(0, 3).forEach(story => {
      const data_str = story.date ? ` (${story.date})` : '';
      linhas.push(`Notícia: ${story.title}${data_str}`);
    });

    // Resultados orgânicos
    (data.organic || []).slice(0, 5).forEach((r, i) => {
      const data_str = r.date ? ` (${r.date})` : '';
      linhas.push(`[${i + 1}] ${r.title}${data_str}\n${r.snippet}`);
    });

    if (!linhas.length) return '';

    return [
      '=== CONTEXTO REAL VERIFICADO (dados extraídos da web agora) ===',
      ...linhas,
      '=== FIM DO CONTEXTO ===',
    ].join('\n\n');
  } catch {
    // Busca falhou: geração continua sem contexto
    return '';
  }
}

// ── repairJson: sanitização de texto bruto do Gemini ──────────────────────

/**
 * Percorre o texto caractere por caractere e escapa corretamente quebras
 * de linha, carriage returns e tabulações que aparecem LITERALMENTE dentro
 * de strings JSON — causa mais comum de "JSON inválido" quando o Gemini
 * gera textos longos ou com parágrafos.
 */
export function repairJson(raw: string): string {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\' && inString) { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }

    if (inString) {
      if      (ch === '\n') { result += '\\n';  continue; }
      else if (ch === '\r') { result += '\\r';  continue; }
      else if (ch === '\t') { result += '\\t';  continue; }
    }

    result += ch;
  }

  return result;
}

/**
 * Tenta fazer JSON.parse com sanitização automática.
 * Tenta 3 vezes: texto bruto → sem blocos markdown → extração de objeto.
 * Lança erro se todas as tentativas falharem.
 */
export function parseGeminiJson(rawText: string): unknown {
  const tryParse = (text: string) => JSON.parse(repairJson(text));

  try { return tryParse(rawText); } catch { /* tenta próximo */ }

  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try { return tryParse(cleaned); } catch { /* tenta próximo */ }

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return tryParse(match[0]); } catch { /* falha total */ }
  }

  throw new Error('JSON invalido do Gemini');
}
