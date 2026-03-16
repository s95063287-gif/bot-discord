const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Show all bans')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const { data } = await axios.get(`${process.env.API_URL}/api/ban/list`, {
                headers: { 'x-secret': process.env.CONFIG_SECRET }
            });

            if (data.bans.length === 0) {
                return interaction.editReply({ content: '✅ No active bans.' });
            }

            const banList = data.bans.slice(0, 10).map(b =>
                `**${b.type}**: \`${b.value}\`\n📝 ${b.reason} | 👮 ${b.bannedBy}`
            ).join('\n\n');

            const embed = new EmbedBuilder()
                .setTitle(`🔨 Ban List (${data.total})`)
                .setColor(0xFF0000)
                .setDescription(banList)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};