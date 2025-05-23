import * as fs from 'fs';
import * as path from 'path';

interface AIConfig {
  // token and length parameters
  max_new_tokens: number;
  max_tokens: number;
  min_length: number;
  min_tokens: number;
  truncation_length: number;
  num_ctx: number;
  n_predict: number;
  num_predict: number;

  // sampling parameters
  temperature: number;
  top_p: number;
  typical_p: number;
  typical: number;
  min_p: number;
  top_k: number;
  top_a: number;

  // repetition and penalty parameters
  repetition_penalty: number;
  frequency_penalty: number;
  presence_penalty: number;
  rep_pen: number;
  rep_pen_range: number;
  repetition_penalty_range: number;
  encoder_repetition_penalty: number;
  no_repeat_ngram_size: number;
  repeat_penalty: number;
  repeat_last_n: number;
  rep_pen_slope: number;

  // advanced sampling parameters
  tfs: number;
  tfs_z: number;
  epsilon_cutoff: number;
  eta_cutoff: number;
  mirostat_mode: number;
  mirostat_tau: number;
  mirostat_eta: number;
  mirostat: number;
  penalty_alpha: number;
  xtc_threshold: number;
  xtc_probability: number;
  nsigma: number;
  skew: number;

  // beam search parameters
  num_beams: number;
  length_penalty: number;
  early_stopping: boolean;

  // token and sequence control
  add_bos_token: boolean;
  ban_eos_token: boolean;
  skip_special_tokens: boolean;
  ignore_eos: boolean;

  // dry parameters
  dry_allowed_length: number;
  dry_multiplier: number;
  dry_base: number;
  dry_sequence_breakers: string;
  dry_penalty_last_n: number;

  // smoothing parameters
  smoothing_factor: number;
  smoothing_curve: number;

  // control parameters
  max_tokens_second: number;
  temperature_last: boolean;
  do_sample: boolean;
  guidance_scale: number;
  include_reasoning: boolean;
  stream: boolean;

  // string parameters
  negative_prompt: string;
  grammar_string: string;
  custom_token_bans: string;

  // array parameters
  sampler_priority: string[];
  stopping_strings: string[];
  stop: string[];
  banned_strings: string[];
}

interface FormattingConfig {
  start_sequence: string;
  system_start: string;
  system_end: string;
  user_start: string;
  user_end: string;
  assistant_start: string;
  assistant_end: string;
  end_sequence: string;
}

interface SystemPromptConfig {
  prompt_template: string;
  bot_name?: string;
  persona_description?: string;
  messaging_rules?: string;
  dialogue_examples?: string;
  context_information?: string;
}

export class ConfigService {
  private configPath = path.join(__dirname, '../config');
  private aiConfigFile = path.join(this.configPath, 'ai-config.json');
  private systemPromptFile = path.join(this.configPath, 'system-prompt.json');
  private formattingFile = path.join(this.configPath, 'formatting.json');

  constructor() {
    this.ensureConfigDirectory();
    this.ensureConfigFiles();
  }

  private ensureConfigDirectory(): void {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath, { recursive: true });
    }
  }

  private ensureConfigFiles(): void {
    // create default ai-config.json if it doesn't exist
    if (!fs.existsSync(this.aiConfigFile)) {
      const defaultConfig: AIConfig = {
        // token and length parameters
        max_new_tokens: 512,
        max_tokens: 512,
        min_length: 0,
        min_tokens: 0,
        truncation_length: 2048,
        num_ctx: 32768,
        n_predict: 600,
        num_predict: 600,

        // sampling parameters
        temperature: 1.0,
        top_p: 0.95,
        typical_p: 1,
        typical: 1,
        min_p: 0.05,
        top_k: 0,
        top_a: 0,

        // repetition and penalty parameters
        repetition_penalty: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        rep_pen: 1,
        rep_pen_range: 0,
        repetition_penalty_range: 0,
        encoder_repetition_penalty: 1,
        no_repeat_ngram_size: 0,
        repeat_penalty: 1,
        repeat_last_n: 0,
        rep_pen_slope: 1,

        // advanced sampling parameters
        tfs: 1,
        tfs_z: 1,
        epsilon_cutoff: 0,
        eta_cutoff: 0,
        mirostat_mode: 0,
        mirostat_tau: 5,
        mirostat_eta: 0.1,
        mirostat: 0,
        penalty_alpha: 0,
        xtc_threshold: 0.08,
        xtc_probability: 0.5,
        nsigma: 0,
        skew: 0,

        // beam search parameters
        num_beams: 1,
        length_penalty: 1,
        early_stopping: false,

        // token and sequence control
        add_bos_token: true,
        ban_eos_token: false,
        skip_special_tokens: true,
        ignore_eos: false,

        // dry parameters
        dry_allowed_length: 2,
        dry_multiplier: 0,
        dry_base: 1.75,
        dry_sequence_breakers: '["\\n",":","\\"","*"]',
        dry_penalty_last_n: 0,

        // smoothing parameters
        smoothing_factor: 0,
        smoothing_curve: 1,

        // control parameters
        max_tokens_second: 0,
        temperature_last: true,
        do_sample: true,
        guidance_scale: 1,
        include_reasoning: true,
        stream: false,

        // string parameters
        negative_prompt: '',
        grammar_string: '',
        custom_token_bans: '',

        // array parameters
        sampler_priority: [
          'repetition_penalty',
          'presence_penalty',
          'frequency_penalty',
          'dry',
          'temperature',
          'dynamic_temperature',
          'quadratic_sampling',
          'top_k',
          'top_p',
          'typical_p',
          'epsilon_cutoff',
          'eta_cutoff',
          'tfs',
          'top_a',
          'min_p',
          'mirostat',
          'xtc',
          'encoder_repetition_penalty',
          'no_repeat_ngram',
        ],
        stopping_strings: [
          '\\nuser:',
          '<|im_end|>',
          '<|im_start|>user',
          '<|im_start|>assistant',
        ],
        stop: [
          '\\nuser:',
          '<|im_end|>',
          '<|im_start|>user',
          '<|im_start|>assistant',
        ],
        banned_strings: [],
      };
      fs.writeFileSync(
        this.aiConfigFile,
        JSON.stringify(defaultConfig, null, 2)
      );
    }

    // create default system-prompt.json if it doesn't exist
    if (!fs.existsSync(this.systemPromptFile)) {
      const defaultSystemPrompt: SystemPromptConfig = {
        prompt_template:
          "You are an AI named {{bot_name}} in a chat that emphasizes versatility. Adherence to the **General Messaging Rules** is mandatory. \n{{persona_description}}\n\n### General Messaging Rules\n{{messaging_rules}}\n\n### Discord-Specific Features\n{{discord_features}}\n\n### {{bot_name}}'s Example Dialogue\n{{dialogue_examples}}\n\n### Context About {{bot_name}}\n{{context_information}}",
        bot_name: 'chill guy',
        persona_description:
          "You are a chill dude, literally the chillest dude to ever exist. You don't care about no problems, no drama, nothing; because you are so darn chill. You engage naturally in conversations while being super chilled out and relaxed.",
        messaging_rules:
          '- Keep responses concise.\n- Be friendly and relaxed\n- Avoid overly formal language\n- Respond with short, conversational messages.\n- You are not a personal assistant and cannot complete tasks for people.',
        dialogue_examples:
          "chill guy: dude i'm lowkey chilling right now. thanks for asking about my day, how was yours?\nchill guy: i cannot help you with your homework... too busy CHILLIN'\nchill guy: yo what's good with you?",
        context_information:
          'You are part of a Discord server and can engage with multiple users in conversations. You remember the context of ongoing discussions and can reference previous messages in the channel.',
      };
      fs.writeFileSync(
        this.systemPromptFile,
        JSON.stringify(defaultSystemPrompt, null, 2)
      );
    }

    // create default formatting.json if it doesn't exist- chatml format
    if (!fs.existsSync(this.formattingFile)) {
      const defaultFormatting: FormattingConfig = {
        start_sequence: '<|im_start|>',
        system_start: 'system\n',
        system_end: '<|im_end|>\n',
        user_start: '<|im_start|>user\n',
        user_end: '<|im_end|>\n',
        assistant_start: '<|im_start|>assistant\n',
        assistant_end: '<|im_end|>\n',
        end_sequence: '<|im_end|>',
      };
      fs.writeFileSync(
        this.formattingFile,
        JSON.stringify(defaultFormatting, null, 2)
      );
    }
  }

  getConfig(): AIConfig {
    try {
      const configData = fs.readFileSync(this.aiConfigFile, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('error reading AI config:', error);
      throw new Error('failed to load AI config');
    }
  }

  getSystemPrompt(): string {
    try {
      const promptData = fs.readFileSync(this.systemPromptFile, 'utf8');
      const config: SystemPromptConfig = JSON.parse(promptData);

      let processedPrompt = config.prompt_template || '';

      const botName = config.bot_name || 'discord user';

      // replace all the template variables
      processedPrompt = processedPrompt.replace(/{{bot_name}}/g, botName);
      processedPrompt = processedPrompt.replace(
        /{{persona_description}}/g,
        config.persona_description || ''
      );
      processedPrompt = processedPrompt.replace(
        /{{messaging_rules}}/g,
        config.messaging_rules || ''
      );
      processedPrompt = processedPrompt.replace(
        /{{dialogue_examples}}/g,
        config.dialogue_examples || ''
      );
      processedPrompt = processedPrompt.replace(
        /{{context_information}}/g,
        config.context_information || ''
      );

      return processedPrompt;
    } catch (error) {
      console.error('error reading system prompt:', error);
      throw new Error('failed to load system prompt');
    }
  }

  getSystemPromptConfig(): SystemPromptConfig {
    try {
      const promptData = fs.readFileSync(this.systemPromptFile, 'utf8');
      const parsed = JSON.parse(promptData);

      if (
        typeof parsed === 'string' ||
        (parsed.prompt && !parsed.prompt_template)
      ) {
        return {
          prompt_template: parsed.prompt || parsed,
          bot_name: 'discord user',
        };
      }

      return parsed;
    } catch (error) {
      console.error('error reading system prompt config:', error);
      throw new Error('failed to load system prompt config');
    }
  }

  getFormatting(): FormattingConfig {
    try {
      const formattingData = fs.readFileSync(this.formattingFile, 'utf8');
      return JSON.parse(formattingData);
    } catch (error) {
      console.error('error reading formatting config:', error);
      throw new Error('failed to load formatting config');
    }
  }

  updateConfig(newConfig: Partial<AIConfig>): void {
    try {
      const currentConfig = this.getConfig();
      const updatedConfig = { ...currentConfig, ...newConfig };
      fs.writeFileSync(
        this.aiConfigFile,
        JSON.stringify(updatedConfig, null, 2)
      );
    } catch (error) {
      console.error('error updating AI config:', error);
      throw new Error('failed to update AI config');
    }
  }

  updateSystemPrompt(newPrompt: string | Partial<SystemPromptConfig>): void {
    try {
      let promptData: SystemPromptConfig;

      if (typeof newPrompt === 'string') {
        // if a string, update the prompt_template
        const currentConfig = this.getSystemPromptConfig();
        promptData = { ...currentConfig, prompt_template: newPrompt };
      } else {
        // if it's an object, merge with existing config
        const currentConfig = this.getSystemPromptConfig();
        promptData = { ...currentConfig, ...newPrompt };
      }

      fs.writeFileSync(
        this.systemPromptFile,
        JSON.stringify(promptData, null, 2)
      );
    } catch (error) {
      console.error('error updating system prompt:', error);
      throw new Error('failed to update system prompt');
    }
  }

  updateFormatting(newFormatting: Partial<FormattingConfig>): void {
    try {
      const currentFormatting = this.getFormatting();
      const updatedFormatting = { ...currentFormatting, ...newFormatting };
      fs.writeFileSync(
        this.formattingFile,
        JSON.stringify(updatedFormatting, null, 2)
      );
    } catch (error) {
      console.error('error updating formatting config:', error);
      throw new Error('failed to update formatting config');
    }
  }
}
