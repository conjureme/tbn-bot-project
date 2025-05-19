import { Events, Message } from 'discord.js';
import { Service } from '../utils/service';

import { MemoryService } from '../utils/memoryService';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot) return;

    // initialize services
    const memoryService = new MemoryService();

    // add message to memory even if not mentioned
    const memoryMessage = {
      id: message.id,
      channelId: message.channelId,
      guildId: message.guildId,
      author: message.author.username,
      authorId: message.author.id,
      content: message.content,
      timestamp: message.createdAt,
      isBot: false,
    };

    memoryService.addMessage(memoryMessage);

    if (!message.mentions.has(message.client.user!)) return;

    try {
      // typing indicator
      if ('send' in message.channel) {
        message.channel.sendTyping();
      }

      // conversation memory
      const contextData = memoryService.getContextForChannel(message.channelId);

      console.log(
        `using ${contextData.messages.length} messages (${contextData.estimatedTokens} tokens) for context`
      );

      // generate response
      const service = new Service();
      const response = await service.generateResponse(
        contextData.messages,
        contextData.summary,
        message.author.username
      );

      // send response
      if (response && response.length > 0) {
        if (!('send' in message.channel)) {
          console.error(
            `can't send messages in this channel: ${message.channel}`
          );
          return;
        }

        // add bot response to memory
        const botMessage = {
          id: '',
          channelId: message.channelId,
          guildId: message.guildId,
          author: message.client.user!.username,
          authorId: message.client.user!.id,
          content: `${message.client.user!.username}: ${response}`,
          timestamp: new Date(),
          isBot: true,
        };

        if (response.length > 2000) {
          const chunks = response.match(/.{1,2000}/g) || [response];
          for (let i = 0; i < chunks.length; i++) {
            const sentMessage = await message.channel.send(chunks[i]);

            // Add each chunk to memory
            if (i === 0) {
              botMessage.id = sentMessage.id;
              botMessage.content = chunks[i];
              memoryService.addMessage({ ...botMessage });
            } else {
              memoryService.addMessage({
                ...botMessage,
                id: sentMessage.id,
                content: chunks[i],
                timestamp: sentMessage.createdAt,
              });
            }
          }
        } else {
          const sentMessage = await message.channel.send(response);
          botMessage.id = sentMessage.id;
          botMessage.timestamp = sentMessage.createdAt;
          memoryService.addMessage(botMessage);
        }
      }
    } catch (error) {
      console.error('there was an error generating response:', error);
      if ('send' in message.channel) {
        await message.channel.send(
          `i ran into an error while processing your message: ${error}`
        );
      }
    }
  },
};
