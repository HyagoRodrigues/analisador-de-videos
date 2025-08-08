import { NextRequest, NextResponse } from 'next/server';

interface SummarizeRequest {
  transcription: string;
  summaryType: 'brief' | 'detailed' | 'bullet_points' | 'key_topics';
  language: string;
}

interface SummaryResponse {
  summary: string;
  wordCount: number;
  keyTopics: string[];
  sentiment: string;
  summaryType: string;
}

export async function POST(request: NextRequest) {
  try {
    const { transcription, summaryType = 'brief', language = 'pt' }: SummarizeRequest = await request.json();

    if (!transcription || transcription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcrição é obrigatória' },
        { status: 400 }
      );
    }

    if (transcription.length < 50) {
      return NextResponse.json(
        { error: 'Transcrição muito curta para gerar resumo' },
        { status: 400 }
      );
    }

    // Gerar resumo usando diferentes estratégias
    const summary = await generateSummary(transcription, summaryType, language);
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor ao gerar resumo' },
      { status: 500 }
    );
  }
}

async function generateSummary(
  transcription: string, 
  summaryType: string, 
  language: string
): Promise<SummaryResponse> {
  // Análise básica do texto
  const wordCount = transcription.split(/\s+/).length;
  const keyTopics = extractKeyTopics(transcription);
  const sentiment = analyzeSentiment(transcription);

  let summary: string;

  // Tentar usar API de IA se disponível, senão usar resumo baseado em regras
  try {
    summary = await generateAISummary(transcription, summaryType, language);
  } catch (aiError) {
    console.warn('Falha na IA, usando resumo baseado em regras:', aiError);
    summary = generateRuleBasedSummary(transcription, summaryType);
  }

  return {
    summary,
    wordCount,
    keyTopics,
    sentiment,
    summaryType
  };
}

async function generateAISummary(
  transcription: string, 
  summaryType: string, 
  language: string
): Promise<string> {
  // Verificar se há chave de API configurada
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!openaiApiKey && !anthropicApiKey) {
    throw new Error('Nenhuma chave de API de IA configurada');
  }

  const prompt = buildPrompt(transcription, summaryType, language);

  // Tentar OpenAI primeiro
  if (openaiApiKey) {
    try {
      return await callOpenAI(prompt, openaiApiKey);
    } catch (error) {
      console.warn('Falha na OpenAI, tentando Anthropic:', error);
    }
  }

  // Tentar Anthropic como fallback
  if (anthropicApiKey) {
    return await callAnthropic(prompt, anthropicApiKey);
  }

  throw new Error('Todas as APIs de IA falharam');
}

function buildPrompt(transcription: string, summaryType: string, language: string): string {
  const languageMap: { [key: string]: string } = {
    'pt': 'português',
    'en': 'inglês',
    'es': 'espanhol',
    'fr': 'francês',
    'de': 'alemão'
  };

  const lang = languageMap[language] || 'português';

  const typeInstructions = {
    'brief': `Crie um resumo breve e conciso em ${lang} (máximo 3 parágrafos)`,
    'detailed': `Crie um resumo detalhado em ${lang} cobrindo todos os pontos principais`,
    'bullet_points': `Crie uma lista de pontos-chave em ${lang} usando bullet points`,
    'key_topics': `Identifique e explique os principais tópicos abordados em ${lang}`
  };

  const instruction = typeInstructions[summaryType as keyof typeof typeInstructions] || typeInstructions.brief;

  return `${instruction} da seguinte transcrição de vídeo:

${transcription}

Resumo:`;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em criar resumos claros e informativos de transcrições de vídeo.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Erro ao gerar resumo';
}

async function callAnthropic(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || 'Erro ao gerar resumo';
}

function generateRuleBasedSummary(transcription: string, summaryType: string): string {
  const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length === 0) {
    return 'Não foi possível gerar resumo da transcrição fornecida.';
  }

  switch (summaryType) {
    case 'brief':
      // Pegar as primeiras 3 sentenças mais significativas
      return sentences.slice(0, 3).join('. ') + '.';
    
    case 'bullet_points':
      // Converter sentenças em bullet points
      return sentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n');
    
    case 'detailed':
      // Pegar mais sentenças para resumo detalhado
      return sentences.slice(0, Math.min(8, sentences.length)).join('. ') + '.';
    
    case 'key_topics':
      // Identificar tópicos baseado em palavras-chave
      const topics = extractKeyTopics(transcription);
      return `Principais tópicos abordados:\n${topics.map(t => `• ${t}`).join('\n')}`;
    
    default:
      return sentences.slice(0, 3).join('. ') + '.';
  }
}

function extractKeyTopics(text: string): string[] {
  // Palavras comuns a serem ignoradas
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das',
    'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'sob', 'sobre',
    'que', 'quem', 'qual', 'quando', 'onde', 'como', 'por que', 'porque',
    'e', 'ou', 'mas', 'porém', 'contudo', 'entretanto', 'todavia',
    'é', 'são', 'foi', 'foram', 'ser', 'estar', 'ter', 'haver',
    'muito', 'muita', 'muitos', 'muitas', 'mais', 'menos', 'bem', 'mal'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Contar frequência das palavras
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Pegar as 5 palavras mais frequentes como tópicos
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

function analyzeSentiment(text: string): string {
  const positiveWords = ['bom', 'ótimo', 'excelente', 'maravilhoso', 'fantástico', 'incrível', 'positivo', 'feliz', 'alegre'];
  const negativeWords = ['ruim', 'péssimo', 'terrível', 'horrível', 'negativo', 'triste', 'problema', 'erro', 'falha'];
  
  const words = text.toLowerCase().split(/\s+/);
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'Positivo';
  if (negativeCount > positiveCount) return 'Negativo';
  return 'Neutro';
}