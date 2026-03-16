const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Push an update to all users')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(o => o.setName('version').setDescription('New version number e.g. 2.0.0').setRequired(true))
        .addStringOption(o => o.setName('url').setDescription('Download URL').setRequired(true))
        .addStringOption(o => o.setName('message').setDescription('Update message for users').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const version = interaction.options.getString('version');
        const url = interaction.options.getString('url');
        const message = interaction.options.getString('message') || `Version ${version} is now available!`;

        try {
            // Config updaten
            await axios.post(`${process.env.API_URL}/api/config/update`, {
                secret: process.env.CONFIG_SECRET,
                requiredVersion: version,
                discordUrl: url
            });

            await interaction.editReply({
                content: `✅ Update pushed!\n\n🔖 **Version:** \`${version}\`\n🔗 **URL:** ${url}\n📣 **Message:** ${message}\n\nAll users will be prompted to update on next launch.`
            });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};