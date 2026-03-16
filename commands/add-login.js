const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-login')
        .setDescription('Hinzufügen eines Logins zur Datenbank')
        .addUserOption(option => option.setName('username').setDescription('Wähle den Nutzer').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('Dauer').setRequired(true)
            .addChoices(
                { name: '1 day', value: '1day' },
                { name: '1 week', value: '1week' },
                { name: '1 month', value: '1month' },
                { name: '3 months', value: '3month' },
                { name: 'permanent', value: 'permanent' }
            ))
        .addStringOption(option => option.setName('password').setDescription('Passwort').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const ownerIds = (process.env.OWNER_ID || '').split(',').map(id => id.trim());
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.editReply({ content: '❌ Du hast keine Berechtigung!' });
        }

        const apiUrl = process.env.API_URL;
        const username = interaction.options.getUser('username').username;
        const duration = interaction.options.getString('duration');
        const password = interaction.options.getString('password') || '';

        try {
            await axios.post(`${apiUrl}/api/add-login`, { username, duration, password });
            await interaction.editReply({ content: `✅ Login erfolgreich hinzugefügt!\n\n👤 **${username}**` });
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Fehler: ${errorMessage}` });
        }
    }
};