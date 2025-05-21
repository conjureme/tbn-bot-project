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
}

interface ConversationMemory {
  channelId: string;
  guildId: string | null;
  messages: MemoryMessage[];
  lastUpdated: Date;
}

interface MemoryConfig {
  maxMessagesPerChannel: number;
  maxTokensInContext: number;
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

  private getMemoryFilePath(guildId: string | null, channelId: string): string {
    // guildId is null in DMs
    if (!guildId) {
      const dmDir = path.join(this.memoryPath, 'dm');
      if (!fs.existsSync(dmDir)) {
        fs.mkdirSync(dmDir, { recursive: true });
      }
      return path.join(dmDir, `${channelId}.json`);
    }

    // create nested folder structure for channels within guilds
    const guildDir = path.join(this.memoryPath, guildId);
    if (!fs.existsSync(guildDir)) {
      fs.mkdirSync(guildDir, { recursive: true });
    }

    return path.join(guildDir, `${channelId}.json`);
  }

  private getMemoryKey(guildId: string | null, channelId: string): string {
    // create a unique key for the memory map
    return guildId ? `${guildId}:${channelId}` : `dm:${channelId}`;
  }

  private loadExistingMemories(): void {
    try {
      const rootFiles = fs
        .readdirSync(this.memoryPath)
        .filter((f) => f.endsWith('.json'));

      for (const file of rootFiles) {
        const channelId = file.replace('.json', '');
        const filePath = path.join(this.memoryPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        data.lastUpdated = new Date(data.lastUpdated);
        data.messages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));

        this.conversationMemories.set(channelId, data);

        if (data.guildId) {
          this.saveMemoryForChannel(data.guildId, channelId);
          fs.unlinkSync(filePath);
        }
      }

      const guildDirs = fs
        .readdirSync(this.memoryPath)
        .filter(
          (dir) =>
            fs.statSync(path.join(this.memoryPath, dir)).isDirectory() &&
            dir !== 'dm'
        );

      // process guild files
      for (const guildId of guildDirs) {
        const guildPath = path.join(this.memoryPath, guildId);
        const channelFiles = fs
          .readdirSync(guildPath)
          .filter((f) => f.endsWith('.json'));

        for (const file of channelFiles) {
          const channelId = file.replace('.json', '');
          const filePath = path.join(guildPath, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          data.lastUpdated = new Date(data.lastUpdated);
          data.messages = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));

          data.guildId = guildId;

          const memoryKey = this.getMemoryKey(guildId, channelId);
          this.conversationMemories.set(memoryKey, data);
        }
      }

      // handle DM files
      const dmPath = path.join(this.memoryPath, 'dm');
      if (fs.existsSync(dmPath)) {
        const dmFiles = fs
          .readdirSync(dmPath)
          .filter((f) => f.endsWith('.json'));

        for (const file of dmFiles) {
          const channelId = file.replace('.json', '');
          const filePath = path.join(dmPath, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          data.lastUpdated = new Date(data.lastUpdated);
          data.messages = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));

          data.guildId = null;

          const memoryKey = this.getMemoryKey(null, channelId);
          this.conversationMemories.set(memoryKey, data);
        }
      }

      console.log(
        `loaded ${this.conversationMemories.size} conversation memories`
      );
    } catch (error) {
      console.error('error loading existing memories:', error);
    }
  }

  private saveMemoryForChannel(
    guildId: string | null,
    channelId: string
  ): void {
    const memoryKey = this.getMemoryKey(guildId, channelId);
    const memory = this.conversationMemories.get(memoryKey);

    if (!memory) return;

    try {
      const filePath = this.getMemoryFilePath(guildId, channelId);
      fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));
    } catch (error) {
      console.error(
        `error when saving memory for channel ${guildId}:${channelId}:`,
        error
      );
    }
  }

  addMessage(message: MemoryMessage): void {
    const { channelId, guildId } = message;
    const memoryKey = this.getMemoryKey(guildId, channelId);

    let memory = this.conversationMemories.get(memoryKey);
    if (!memory) {
      memory = {
        channelId,
        guildId,
        messages: [],
        lastUpdated: new Date(),
      };
      this.conversationMemories.set(memoryKey, memory);
    }

    memory.messages.push(message);
    memory.lastUpdated = new Date();

    if (memory.messages.length > this.config.maxMessagesPerChannel) {
      const excessMessages =
        memory.messages.length - this.config.maxMessagesPerChannel;
      memory.messages.splice(0, excessMessages);
    }

    this.saveMemoryForChannel(guildId, channelId);
  }

  getContextForChannel(
    channelId: string,
    guildId: string | null = null,
    maxTokens?: number
  ): {
    messages: MemoryMessage[];
    estimatedTokens: number;
  } {
    const memoryKey = this.getMemoryKey(guildId, channelId);
    let memory = this.conversationMemories.get(memoryKey);

    if (!memory && !guildId) {
      memory = this.conversationMemories.get(channelId);
    }

    if (!memory) {
      return { messages: [], estimatedTokens: 0 };
    }

    const targetTokens = maxTokens || this.config.maxTokensInContext;
    let estimatedTokens = 0;
    const selectedMessages: MemoryMessage[] = [];

    const sortedMessages = [...memory.messages].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    for (let i = sortedMessages.length - 1; i >= 0; i--) {
      const message = sortedMessages[i];
      const messageTokens = this.estimateTokens(message.content);

      if (estimatedTokens + messageTokens <= targetTokens) {
        selectedMessages.unshift(message);
        estimatedTokens += messageTokens;
      } else {
        break;
      }
    }

    return {
      messages: selectedMessages,
      estimatedTokens,
    };
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  clearMemoryForChannel(
    channelId: string,
    guildId: string | null = null
  ): void {
    const memoryKey = this.getMemoryKey(guildId, channelId);
    this.conversationMemories.delete(memoryKey);

    if (!guildId) {
      this.conversationMemories.delete(channelId);
    }

    const filePath = this.getMemoryFilePath(guildId, channelId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (!guildId) {
      const legacyPath = path.join(this.memoryPath, `${channelId}.json`);
      if (fs.existsSync(legacyPath)) {
        fs.unlinkSync(legacyPath);
      }
    }

    console.log(
      `cleared memory for channel ${guildId || 'unknown'}:${channelId}`
    );
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
