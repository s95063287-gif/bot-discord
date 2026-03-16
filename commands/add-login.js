

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-login')
        .setDescription('Hinzufügen eines Logins zur Datenbank')
        .addUserOption(option => option.setName('username').setDescription('Wähle den Nutzer').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('Dauer (z.B. 7d, 30d)').setRequired(true))
        .addStringOption(option => option.setName('password').setDescription('Passwort').setRequired(true)),

    async execute(interaction) {
        // Debugging ausgeben, damit du siehst, ob die Variablen geladen wurden
        console.log("API_URL:", process.env.API_URL);
        console.log("OWNER_ID:", process.env.OWNER_ID);
        console.log("Aktueller User ID:", interaction.user.id);

        // Berechne Owner IDs direkt aus ENV (unterstützt auch Kommata, falls du mehrere fährst)
        const ownerIdsRaw = process.env.OWNER_ID || '';
        const ownerIds = ownerIdsRaw.split(',').map(id => id.trim());
        const userId = interaction.user.id;

        if (!ownerIds.includes(userId)) {
            return interaction.reply({ content: '❌ Du hast keine Berechtigung!', ephemeral: true });
        }

        const apiUrl = process.env.API_URL;
        
        if (!apiUrl) {
            console.error("FEHLER: API_URL ist in der .env Datei nicht gesetzt!");
            return interaction.reply({ content: '❌ Server-Fehler: API_URL fehlt.', ephemeral: true });
        }

        const username = interaction.options.getUser('username').username;
        const discordId = interaction.options.getUser('username').id;
        const duration = interaction.options.getString('duration');
        const password = interaction.options.getString('password');

        try {
            // Anfordern an deine API
            const response = await axios.post(`${apiUrl}/add-login`, {
                username,
                discordId,
                duration,
                password
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            await interaction.reply({ content: `✅ Login erfolgreich hinzugefügt!\n\n👤 ${username}`, ephemeral: true });
        } catch (error) {
            console.error('Fehler beim Hinzufügen:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.error || 'Unbekannter Fehler.';
            await interaction.reply({ content: `❌ Fehler: ${errorMessage}`, ephemeral: true });
        }
    }
};