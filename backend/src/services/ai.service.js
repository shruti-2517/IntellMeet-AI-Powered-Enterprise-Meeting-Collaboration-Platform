/**
 * IntellMeet Backend – OpenAI AI Service
 * Whisper transcription + GPT-4o meeting summarization.
 */

const OpenAI = require('openai');
const logger = require('../middleware/logger');

let openaiClient = null;

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. AI features are disabled.');
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

// ─── Retry Helper ─────────────────────────────────────────────────────────────
const withRetry = async (fn, retries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.status === 429 || err.code === 'rate_limit_exceeded';
      if (attempt === retries || !isRateLimit) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`OpenAI rate limit hit. Retrying in ${delay}ms (attempt ${attempt}/${retries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
};

// ─── Whisper Transcription ────────────────────────────────────────────────────

/**
 * Transcribe an audio buffer using OpenAI Whisper.
 * @param {Buffer} audioBuffer - Raw audio file buffer
 * @param {string} mimeType - e.g. 'audio/webm', 'audio/mp4', 'audio/wav'
 * @param {string} filename - Original filename for extension detection
 * @returns {{ text: string, segments: Array }}
 */
const transcribeMeeting = async (audioBuffer, mimeType = 'audio/webm', filename = 'audio.webm') => {
  const client = getClient();

  const { Readable } = require('stream');
  const stream = Readable.from(audioBuffer);
  stream.path = filename;

  const result = await withRetry(() =>
    client.audio.transcriptions.create({
      file: stream,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    })
  );

  logger.info(`Whisper transcription complete: ${result.text?.length || 0} chars`);

  return {
    text: result.text || '',
    segments: (result.segments || []).map((seg) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
      confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 1,
    })),
  };
};

// ─── System Prompt ────────────────────────────────────────────────────────────
const SUMMARIZATION_SYSTEM_PROMPT = `You are an expert enterprise meeting analyst. Analyze meeting transcripts and extract structured insights. 
Always respond with valid JSON only, no markdown, no extra text. 
Format your response as:
{
  "summary": "string (2-3 paragraphs covering key decisions, discussions, and outcomes)",
  "keyPoints": ["string", "string", ...],
  "actionItems": [
    {
      "text": "string (specific action to take)",
      "assigneeName": "string (person name or empty string)",
      "priority": "low|medium|high",
      "suggestedDueDate": "ISO date string or null"
    }
  ],
  "sentiment": "positive|neutral|negative",
  "topics": ["string", ...]
}`;

// ─── GPT-4o Meeting Summarization ─────────────────────────────────────────────

/**
 * Generate a structured meeting summary using GPT-4o.
 * Falls back to GPT-3.5-turbo if GPT-4o fails.
 */
const generateMeetingSummary = async (transcript, meetingTitle, participants = []) => {
  const client = getClient();
  const participantsList = participants.map((p) => p.name || p.email || 'Unknown').join(', ');

  const userPrompt = `Meeting Title: "${meetingTitle}"
Participants: ${participantsList || 'Unknown'}
Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Transcript:
${transcript}

Generate a comprehensive meeting summary in the required JSON format.`;

  const callGPT = async (model) => {
    const response = await withRetry(() =>
      client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SUMMARIZATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000,
      })
    );

    const usage = response.usage;
    logger.info(`GPT summary (${model}): ${usage?.total_tokens || 0} tokens used`);
    return response.choices[0].message.content;
  };

  let raw;
  try {
    raw = await callGPT('gpt-4o');
  } catch (err) {
    logger.warn(`GPT-4o failed (${err.message}), falling back to gpt-3.5-turbo`);
    raw = await callGPT('gpt-3.5-turbo');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logger.error('Failed to parse GPT JSON response');
    parsed = {
      summary: transcript.slice(0, 500),
      keyPoints: ['Unable to parse AI summary'],
      actionItems: [],
      sentiment: 'neutral',
      topics: [],
    };
  }

  return {
    summary: parsed.summary || '',
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
    topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    model: 'gpt-4o',
  };
};

// ─── Extract Action Items ──────────────────────────────────────────────────────

/**
 * Extract action items from raw transcript text using GPT-4o function calling.
 */
const extractActionItems = async (text) => {
  const client = getClient();

  const response = await withRetry(() =>
    client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Extract action items from the following meeting text. Identify who is responsible, what they need to do, and any mentioned deadlines. Return valid JSON only.',
        },
        {
          role: 'user',
          content: `Text:\n${text}\n\nExtract action items as JSON array: [{ "assigneeName": "string", "text": "string", "dueDate": "ISO date or null", "priority": "low|medium|high" }]`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1000,
    })
  );

  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    return Array.isArray(parsed.items || parsed) ? (parsed.items || parsed) : [];
  } catch {
    return [];
  }
};

// ─── Improve/Regenerate Summary ───────────────────────────────────────────────

/**
 * Regenerate or improve an existing summary with additional instructions.
 */
const improveSummary = async (existingSummary, transcript, instructions = '') => {
  const client = getClient();

  const response = await withRetry(() =>
    client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SUMMARIZATION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Existing summary:\n${existingSummary}\n\nOriginal transcript:\n${transcript}\n\nInstructions: ${instructions || 'Improve the summary for clarity and completeness.'}\n\nReturn improved JSON summary.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    })
  );

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return null;
  }
};

module.exports = {
  transcribeMeeting,
  generateMeetingSummary,
  extractActionItems,
  improveSummary,
};
