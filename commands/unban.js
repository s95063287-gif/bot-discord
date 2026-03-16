const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user, hwid, discord or key')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(o => o.setName('type').setDescription('Ban type').setRequired(true)
            .addChoices(
                { name: 'Username', value: 'username' },
                { name: 'Discord ID', value: 'discord' },
                { name: 'HWID', value: 'hwid' },
                { name: 'License Key', value: 'key' }
            ))
        .addStringOption(o => o.setName('value').setDescription('Value to unban').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const type = interaction.options.getString('type');
        const value = interaction.options.getString('value');

        try {
            const { data } = await axios.post(`${process.env.API_URL}/api/ban/unban`, {
                secret: process.env.CONFIG_SECRET,
                type, value
            });

            const embed = new EmbedBuilder()
                .setTitle('✅ Unban Executed')
                .setColor(0x57F287)
                .addFields(
                    { name: '🎯 Type', value: type, inline: true },
                    { name: '🔍 Value', value: value, inline: true },
                    { name: '🔗 Also Unbanned', value: data.unbanned.join('\n') || 'None', inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};