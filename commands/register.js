const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register with a key')
        .addStringOption(o => o.setName('key').setDescription('Your key').setRequired(true))
        .addStringOption(o => o.setName('username').setDescription('Your username').setRequired(true))
        .addStringOption(o => o.setName('password').setDescription('Your password').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const key = interaction.options.getString('key');
        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password') || '';
        const hwid = interaction.user.id;
        const discordId = interaction.user.id;

        try {
            await axios.post(`${process.env.API_URL}/api/register`, { 
                key, 
                username, 
                password, 
                hwid,
                discordId
            });
            await interaction.editReply({ content: `✅ Successfully registered as **${username}**!\n🎮 Discord: <@${discordId}>` });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};