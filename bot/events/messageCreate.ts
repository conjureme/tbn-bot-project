import { Events, Message } from 'discord.js';

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
      // ....................
      // ....................
      // ....................
      // ....................
      // ....................
    } catch (error) {
      console.error('there was an error generating response:', error);
    }
  },
};
