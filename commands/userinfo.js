const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get info about a user')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(o => o.setName('username').setDescription('Username').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const username = interaction.options.getString('username');

        try {
            const { data } = await axios.post(`${process.env.API_URL}/api/userinfo`, { username });
            const expDate = new Date(data.expirationDate).toLocaleDateString('en-GB');
            const embed = new EmbedBuilder()
                .setTitle(`👤 User Info — ${data.username}`)
                .setColor(0x5865F2)
                .addFields(
                    { name: 'Username', value: data.username, inline: true },
                    { name: 'HWID', value: data.hwid, inline: true },
                    { name: 'Expires', value: expDate, inline: true }
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};