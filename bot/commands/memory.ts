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
          memoryService.clearMemoryForChannel(interaction.channelId);
          await interaction.reply({
            content: 'memory has been cleared for this channel!',
            flags: ['Ephemeral'],
          });
          break;
        }

        case 'info': {
          const context = memoryService.getContextForChannel(
            interaction.channelId
          );
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
              {
                name: 'has summary',
                value: context.summary ? 'yes' : 'no',
                inline: true,
              },
            ],
            color: 0x3340d1,
          };

          if (context.summary) {
            embed.fields.push({
              name: 'summary',
              value:
                context.summary.substring(0, 1000) +
                (context.summary.length > 1000 ? '...' : ''),
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
