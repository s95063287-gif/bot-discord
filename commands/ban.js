const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user, hwid, discord or key')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub
            .setName('user')
            .setDescription('Ban by username')
            .addStringOption(o => o.setName('username').setDescription('Username').setRequired(true))
            .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
        )
        .addSubcommand(sub => sub
            .setName('discord')
            .setDescription('Ban by Discord ID')
            .addUserOption(o => o.setName('user').setDescription('Discord User').setRequired(true))
            .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
        )
        .addSubcommand(sub => sub
            .setName('hwid')
            .setDescription('Ban by HWID')
            .addStringOption(o => o.setName('hwid').setDescription('HWID').setRequired(true))
            .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
        )
        .addSubcommand(sub => sub
            .setName('key')
            .setDescription('Ban a license key')
            .addStringOption(o => o.setName('key').setDescription('License Key').setRequired(true))
            .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const sub = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const bannedBy = interaction.user.username;

        let type, value;

        if (sub === 'user') {
            type = 'username';
            value = interaction.options.getString('username');
        } else if (sub === 'discord') {
            type = 'discord';
            value = interaction.options.getUser('user').id;
        } else if (sub === 'hwid') {
            type = 'hwid';
            value = interaction.options.getString('hwid');
        } else if (sub === 'key') {
            type = 'key';
            value = interaction.options.getString('key');
        }

        try {
            const { data } = await axios.post(`${process.env.API_URL}/api/ban/ban`, {
                secret: process.env.CONFIG_SECRET,
                type, value, reason, bannedBy
            });

            const embed = new EmbedBuilder()
                .setTitle('🔨 Ban Executed')
                .setColor(0xFF0000)
                .addFields(
                    { name: '🎯 Type', value: type, inline: true },
                    { name: '🔍 Value', value: value, inline: true },
                    { name: '📝 Reason', value: reason, inline: false },
                    { name: '👮 Banned By', value: bannedBy, inline: true },
                    { name: '🔗 Also Banned', value: data.banned.join('\n') || 'None', inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};