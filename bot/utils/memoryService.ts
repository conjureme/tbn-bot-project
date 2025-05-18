import * as fs from 'fs';
import * as path from 'path';

interface MemoryMessage {
  id: string;
  channelId: string;
  guildId: string | null;
  author: string;
  authorId: string;
  content: string;
  timestamp: Date;
  isBot: boolean;
  relevanceScore?: number;
}

interface ConversationMemory {
  channelId: string;
  messages: MemoryMessage[];
  lastUpdated: Date;
  summary?: string;
  keyTopics?: string[];
}

interface MemoryConfig {
  maxMessagesPerChannel: number;
  maxTokensInContext: number;
  summaryThreshold: number; // messages before creating a summary
  relevanceDecayHours: number; // hhow quickly messages become less relevant
  enableSummarization: boolean;
}

export class MemoryService {
  private memoryPath = path.join(__dirname, '../memory');
  private configFile = path.join(__dirname, '../config/memory-config.json');
  private conversationMemories = new Map<string, ConversationMemory>();
  private config!: MemoryConfig;

  constructor() {
    this.ensureMemoryDirectory();
    this.loadConfig();
    this.loadExistingMemories();
  }

  private ensureMemoryDirectory(): void {
    if (!fs.existsSync(this.memoryPath)) {
      fs.mkdirSync(this.memoryPath, { recursive: true });
    }
  }

  private loadConfig(): void {
    const defaultConfig: MemoryConfig = {
      maxMessagesPerChannel: 100,
      maxTokensInContext: 4000, // token estimate
      summaryThreshold: 50,
      relevanceDecayHours: 24,
      enableSummarization: false,
    };

    if (fs.existsSync(this.configFile)) {
      try {
        const configData = fs.readFileSync(this.configFile, 'utf8');
        this.config = { ...defaultConfig, ...JSON.parse(configData) };
      } catch (error) {
        console.error('Error loading memory config:', error);
        this.config = defaultConfig;
      }
    } else {
      this.config = defaultConfig;
      fs.writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2));
    }
  }

  private loadExistingMemories(): void {
    try {
      const files = fs
        .readdirSync(this.memoryPath)
        .filter((f) => f.endsWith('.json'));

      for (const file of files) {
        const channelId = file.replace('.json', '');
        const filePath = path.join(this.memoryPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // convert timestamps back to objects
        data.lastUpdated = new Date(data.lastUpdated);
        data.messages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));

        this.conversationMemories.set(channelId, data);
      }

      console.log(
        `loaded ${this.conversationMemories.size} conversation memories`
      );
    } catch (error) {
      console.error('error loading existing memories:', error);
    }
  }

  private saveMemoryForChannel(channelId: string): void {
    const memory = this.conversationMemories.get(channelId);
    if (!memory) return;

    try {
      const filePath = path.join(this.memoryPath, `${channelId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));
    } catch (error) {
      console.error(
        `error when saving memory for channel ${channelId}:`,
        error
      );
    }
  }

  addMessage(message: MemoryMessage): void {
    const { channelId } = message;

    let memory = this.conversationMemories.get(channelId);
    if (!memory) {
      memory = {
        channelId,
        messages: [],
        lastUpdated: new Date(),
        keyTopics: [],
      };
      this.conversationMemories.set(channelId, memory);
    }

    // add new message
    memory.messages.push(message);
    memory.lastUpdated = new Date();

    // trim old messages
    if (memory.messages.length > this.config.maxMessagesPerChannel) {
      // remove oldest messages but keep summary
      const excessMessages =
        memory.messages.length - this.config.maxMessagesPerChannel;
      memory.messages.splice(0, excessMessages);
    }

    // check if summary is needed
    if (
      this.config.enableSummarization &&
      memory.messages.length >= this.config.summaryThreshold &&
      !memory.summary
    ) {
      this.createSummary(channelId);
    }

    // save to folder
    this.saveMemoryForChannel(channelId);
  }

  getContextForChannel(
    channelId: string,
    maxTokens?: number
  ): {
    messages: MemoryMessage[];
    summary?: string;
    estimatedTokens: number;
  } {
    const memory = this.conversationMemories.get(channelId);
    if (!memory) {
      return { messages: [], estimatedTokens: 0 };
    }

    const targetTokens = maxTokens || this.config.maxTokensInContext;
    let estimatedTokens = 0;
    const selectedMessages: MemoryMessage[] = [];

    // add summary tokens if available
    if (memory.summary) {
      estimatedTokens += this.estimateTokens(memory.summary);
    }

    // Aad messages from most recent and calculate relevancy
    const now = new Date();
    const sortedMessages = memory.messages
      .map((msg) => ({
        ...msg,
        relevanceScore: this.calculateRelevance(msg, now),
      }))
      .sort((a, b) => b.relevanceScore! - a.relevanceScore!);

    for (const message of sortedMessages) {
      const messageTokens = this.estimateTokens(message.content);

      if (estimatedTokens + messageTokens <= targetTokens) {
        selectedMessages.push(message);
        estimatedTokens += messageTokens;
      } else {
        break;
      }
    }

    // sort selected messages chronologically
    selectedMessages.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    return {
      messages: selectedMessages,
      summary: memory.summary,
      estimatedTokens,
    };
  }

  private calculateRelevance(message: MemoryMessage, now: Date): number {
    const hoursAgo =
      (now.getTime() - message.timestamp.getTime()) / (1000 * 60 * 60);

    // relevancy decrease with time
    let relevance = Math.max(0, 1 - hoursAgo / this.config.relevanceDecayHours);

    // relevancy boosts
    // boost relevancy for any bot messages
    if (message.isBot) {
      relevance *= 1.5;
    }

    // longer messages
    if (message.content.length > 100) {
      relevance *= 1.2;
    }

    // messages with questions
    if (message.content.includes('?')) {
      relevance *= 1.3;
    }

    return relevance;
  }

  private estimateTokens(text: string): number {
    // rough estimate of 4 chars per token
    return Math.ceil(text.length / 4);
  }

  private async createSummary(channelId: string): Promise<void> {
    // TODO: should make API call to write a summary
    // for now, functionality disabled
  }

  clearMemoryForChannel(channelId: string): void {
    this.conversationMemories.delete(channelId);

    const filePath = path.join(this.memoryPath, `${channelId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.log(`cleared memory for channel ${channelId}`);
  }

  getMemoryStats(): {
    totalChannels: number;
    totalMessages: number;
    oldestMessage: Date | null;
    newestMessage: Date | null;
  } {
    let totalMessages = 0;
    let oldestMessage: Date | null = null;
    let newestMessage: Date | null = null;

    for (const memory of this.conversationMemories.values()) {
      totalMessages += memory.messages.length;

      for (const msg of memory.messages) {
        if (!oldestMessage || msg.timestamp < oldestMessage) {
          oldestMessage = msg.timestamp;
        }
        if (!newestMessage || msg.timestamp > newestMessage) {
          newestMessage = msg.timestamp;
        }
      }
    }

    return {
      totalChannels: this.conversationMemories.size,
      totalMessages,
      oldestMessage,
      newestMessage,
    };
  }
}
