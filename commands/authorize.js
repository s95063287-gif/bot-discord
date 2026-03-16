const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('authorize')
        .setDescription('Get your authorization token for the loader')
        .addStringOption(o => o.setName('license').setDescription('Your license key').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const license = interaction.options.getString('license');

        try {
            // License Key prüfen
            const keyCheck = await axios.post(`${process.env.API_URL}/api/check-key`, {
                key: license
            });

            if (!keyCheck.data.valid) {
                return interaction.editReply({
                    content: `❌ Invalid or expired license key!`
                });
            }

            // Token generieren
            const { data } = await axios.post(`${process.env.API_URL}/api/authorize/create`, {
                secret: process.env.CONFIG_SECRET,
                discordId: interaction.user.id,
                discordUsername: interaction.user.username,
                license: license
            });

            const expireTime = Math.floor(Date.now() / 1000) + 300;

            await interaction.editReply({
                content: `✅ License verified!\n\n🔑 Your authorization token:\n\`\`\`${data.token}\`\`\`\n⚠️ Expires <t:${expireTime}:R>\nEnter this token in the loader to link your Discord account!`
            });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};