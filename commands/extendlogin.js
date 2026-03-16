const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('extendlogin')
        .setDescription('Extend a user\'s login duration')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(o => o.setName('username').setDescription('Username').setRequired(true))
        .addStringOption(o => o.setName('duration').setDescription('Duration').setRequired(true)
            .addChoices(
                { name: '1 day', value: '1day' },
                { name: '1 week', value: '1week' },
                { name: '1 month', value: '1month' },
                { name: '3 months', value: '3month' },
                { name: 'Permanent', value: 'permanent' }
            )),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const username = interaction.options.getString('username');
        const duration = interaction.options.getString('duration');

        try {
            const { data } = await axios.post(`${process.env.API_URL}/api/extendlogin`, { username, duration });
            const newExp = new Date(data.expirationDate).toLocaleDateString('en-GB');
            await interaction.editReply({ content: `✅ Login for **${username}** extended! New expiry: **${newExp}**` });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};