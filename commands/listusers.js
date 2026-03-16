const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listusers')
        .setDescription('List all registered users')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const { data } = await axios.get(`${process.env.API_URL}/api/listusers`);
            const userList = data.users.slice(0, 20).map((u, i) => {
                const exp = new Date(u.expirationDate).toLocaleDateString('en-GB');
                return `**${i + 1}.** ${u.username} — expires ${exp}`;
            }).join('\n') || 'No users found.';

            const embed = new EmbedBuilder()
                .setTitle(`👥 Registered Niggers (${data.total})`)
                .setColor(0x5865F2)
                .setDescription(userList)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};