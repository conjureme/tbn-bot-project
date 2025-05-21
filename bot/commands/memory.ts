import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { MemoryService } from '../utils/memoryService';

export default {
  data: new SlashCommandBuilder()
    .setName('memory')
    .setDescription('manage bot memory')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((subcommand) =>
      subcommand.setName('stats').setDescription('show memory stats')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('clear')
        .setDescription('clears memory for this channel')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('info')
        .setDescription('show memory info for this channel')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const memoryService = new MemoryService();
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'stats': {
          const stats = memoryService.getMemoryStats();
          const embed = {
            title: 'memory stats',
            fields: [
              {
                name: 'total channels',
                value: stats.totalChannels.toString(),
                inline: true,
              },
              {
                name: 'total messages',
                value: stats.totalMessages.toString(),
                inline: true,
              },
              {
                name: 'oldest message',
                value: stats.oldestMessage?.toDateString() || 'none',
                inline: true,
              },
              {
                name: 'newest message',
                value: stats.newestMessage?.toDateString() || 'none',
                inline: true,
              },
            ],
            color: 0x3340d1,
          };
          await interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
          break;
        }

        case 'clear': {
          // Pass both channelId and guildId to the clearMemory function
          memoryService.clearMemoryForChannel(
            interaction.channelId,
            interaction.guildId
          );
          await interaction.reply({
            content: 'memory has been cleared for this channel!',
            flags: ['Ephemeral'],
          });
          break;
        }

        case 'info': {
          // Pass both channelId and guildId to getContextForChannel
          const context = memoryService.getContextForChannel(
            interaction.channelId,
            interaction.guildId
          );

          // Create a basic info embed
          const embed = {
            title: 'channel memory info',
            fields: [
              {
                name: 'messages in memory',
                value: context.messages.length.toString(),
                inline: true,
              },
              {
                name: 'estimated tokens',
                value: context.estimatedTokens.toString(),
                inline: true,
              },
            ],
            color: 0x3340d1,
          };

          // If there are messages, add a sample of the most recent message
          if (context.messages.length > 0) {
            const latestMsg = context.messages[context.messages.length - 1];
            const authorDisplay = latestMsg.isBot
              ? 'Bot'
              : `${latestMsg.author} <@${latestMsg.authorId}>`;

            embed.fields.push({
              name: 'most recent message',
              value: `**${authorDisplay}**: ${latestMsg.content.substring(
                0,
                200
              )}${latestMsg.content.length > 200 ? '...' : ''}`,
              inline: false,
            });
          }

          await interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
          break;
        }
      }
    } catch (error) {
      console.error('error in memory command:', error);
      await interaction.reply({
        content: 'there was an error while running the memory command.',
        ephemeral: true,
      });
    }
  },
};
