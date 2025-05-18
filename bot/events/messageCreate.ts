import { Events, Message } from 'discord.js';
import { Service } from '../utils/service';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot) return;

    if (!message.mentions.has(message.client.user!)) return;

    try {
      const messages = await message.channel.messages.fetch({
        limit: 5,
        before: message.id,
      });
      const conversationHistory = messages
        .reverse()
        .map((msg) => ({
          author: msg.author.username,
          content: msg.content.replace(/<@!?\d+>/g, '').trim(), // remove mentions
          timestamp: msg.createdAt,
        }))
        .filter((msg) => msg.content.length > 0);

      conversationHistory.push({
        author: message.author.username,
        content: message.content.replace(/<@!?\d+>/g, '').trim(),
        timestamp: message.createdAt,
      });

      // generate response
      const service = new Service();
      const response = await service.generateResponse(
        conversationHistory,
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

        if (response.length > 2000) {
          const chunks = response.match(/.{1,2000}/g) || [response];
          for (const chunk of chunks) {
            await message.channel.send(chunk);
          }
        } else {
          await message.channel.send(response);
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
