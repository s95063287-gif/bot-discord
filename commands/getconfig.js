const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getconfig')
        .setDescription('Show current app configuration')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const { data } = await axios.get(`${process.env.API_URL}/api/config`);

            const embed = new EmbedBuilder()
                .setTitle('⚙️ App Configuration')
                .setColor(0x5865F2)
                .addFields(
                    { name: '🔧 Maintenance Mode', value: data.maintenanceMode ? '✅ ON' : '❌ OFF', inline: true },
                    { name: '📡 Offline Mode', value: data.offlineMode ? '✅ ON' : '❌ OFF', inline: true },
                    { name: '📝 Registrations', value: data.allowNewRegistrations ? '✅ Open' : '❌ Closed', inline: true },
                    { name: '🔖 Version', value: data.version || 'N/A', inline: true },
                    { name: '⚠️ Required Version', value: data.requiredVersion || 'N/A', inline: true },
                    { name: '👥 Max Users', value: data.maxUsers === 0 ? 'Unlimited' : String(data.maxUsers), inline: true },
                    { name: '📣 MOTD', value: data.motd || 'Not set', inline: false },
                    { name: '🔧 Maintenance Message', value: data.maintenanceMessage || 'Not set', inline: false },
                    { name: '🔗 Discord URL', value: data.discordUrl || 'Not set', inline: false },
                    { name: '🕐 Last Updated', value: new Date(data.updatedAt).toLocaleString('en-GB'), inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};