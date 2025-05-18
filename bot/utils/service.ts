import { ConfigService } from './configService';

interface ConversationMessage {
  author: string;
  content: string;
  timestamp: Date;
}

interface APIRequest {
  prompt: string;
  max_new_tokens: number;
  max_tokens: number;
  temperature: number;
  top_p: number;
  typical_p: number;
  typical: number;
  min_p: number;
  repetition_penalty: number;
  frequency_penalty: number;
  presence_penalty: number;
  top_k: number;
  skew: number;
  min_length: number;
  min_tokens: number;
  num_beams: number;
  length_penalty: number;
  early_stopping: boolean;
  add_bos_token: boolean;
  smoothing_factor: number;
  smoothing_curve: number;
  dry_allowed_length: number;
  dry_multiplier: number;
  dry_base: number;
  dry_sequence_breakers: string;
  dry_penalty_last_n: number;
  max_tokens_second: number;
  sampler_priority: string[];
  stopping_strings: string[];
  stop: string[];
  truncation_length: number;
  ban_eos_token: boolean;
  skip_special_tokens: boolean;
  include_reasoning: boolean;
  top_a: number;
  tfs: number;
  epsilon_cutoff: number;
  eta_cutoff: number;
  mirostat_mode: number;
  mirostat_tau: number;
  mirostat_eta: number;
  custom_token_bans: string;
  banned_strings: string[];
  xtc_threshold: number;
  xtc_probability: number;
  nsigma: number;
  rep_pen: number;
  rep_pen_range: number;
  repetition_penalty_range: number;
  encoder_repetition_penalty: number;
  no_repeat_ngram_size: number;
  penalty_alpha: number;
  temperature_last: boolean;
  do_sample: boolean;
  guidance_scale: number;
  negative_prompt: string;
  grammar_string: string;
  repeat_penalty: number;
  tfs_z: number;
  repeat_last_n: number;
  n_predict: number;
  num_predict: number;
  num_ctx: number;
  mirostat: number;
  ignore_eos: boolean;
  rep_pen_slope: number;
  stream: boolean;
}

interface APIResponse {
  choices?: Array<{
    text?: string;
  }>;
  // handle different response types
  text?: string;
  content?: string;

  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export class service {
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
  }

  async generateResponse(
    conversationHistory: ConversationMessage[],
    currentUser: string
  ): Promise<string> {
    try {
      const config = this.configService.getConfig();
      const systemPrompt = this.configService.getSystemPrompt();
      const formatting = this.configService.getFormatting();

      // build prompt using conversation history
      const prompt = this.buildPrompt(
        conversationHistory,
        currentUser,
        systemPrompt,
        formatting
      );

      // prepare API request
      const requestBody: APIRequest = {
        prompt: prompt,

        // all parameters from config
        ...config,
      };

      console.log('sending request to API...');

      // make APi call
      const response = await fetch(`${process.env.API_SERVER}/v1/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data: APIResponse = await response.json();

      // extract generated text from the response
      let generatedText = '';

      if (data.choices && data.choices.length > 0) {
        generatedText = data.choices[0].text || '';
      } else if (data.text) {
        generatedText = data.text;
      } else if (data.content) {
        generatedText = data.content;
      }

      // clean up response
      const cleanedResponse = this.cleanResponse(generatedText, formatting);

      return cleanedResponse;
    } catch (error) {
      console.error('error in generateResponse:', error);
      throw error;
    }
  }

  private buildPrompt(
    conversationHistory: ConversationMessage[],
    currentUser: string,
    systemPrompt: string,
    formatting: any
  ): string {
    const {
      start_sequence,
      system_start,
      system_end,
      user_start,
      user_end,
      assistant_start,
      assistant_end,
      end_sequence,
    } = formatting;

    let prompt = start_sequence + system_start + systemPrompt + system_end;

    // add conversation history
    for (const message of conversationHistory) {
      prompt += user_start + `${message.author}: ${message.content}` + user_end;
    }

    // add assistant start token to prompt
    prompt += assistant_start;

    return prompt;
  }

  private cleanResponse(response: string, formatting: any): string {
    if (!response) return '';

    // remove all formatting tokens
    let cleaned = response;

    // remove all format strings
    const tokensToRemove = [
      formatting.start_sequence,
      formatting.system_start,
      formatting.system_end,
      formatting.user_start,
      formatting.user_end,
      formatting.assistant_start,
      formatting.assistant_end,
      formatting.end_sequence,
      '<|im_start|>',
      '<|im_end|>',
      'AI Assistant:',
      'user:',
      'system:',
      'assistant:',
    ];

    for (const token of tokensToRemove) {
      if (token) {
        cleaned = cleaned.replace(
          new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          ''
        );
      }
    }

    // clean up any extra whitespace and newlines
    cleaned = cleaned.trim().replace(/\n{3,}/g, '\n\n');

    // remove any remaining user or assistant prefixes
    cleaned = cleaned.replace(/^(user:|assistant:)\s*/i, '');

    return cleaned;
  }
}
