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

            const expDate = new Date(data.expirationDate);
            const createdAt = new Date(data.createdAt);
            const now = new Date();
            const isExpired = expDate < now;
            const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

            // Discord User fetchen wenn discordId vorhanden
            let discordUser = null;
            if (data.discordId && data.discordId !== 'Not set') {
                try {
                    discordUser = await interaction.client.users.fetch(data.discordId);
                } catch {}
            }

            const embed = new EmbedBuilder()
                .setTitle(`👤 User Info — ${data.username}`)
                .setColor(isExpired ? 0xFF0000 : 0x57F287)
                .setThumbnail(discordUser ? discordUser.displayAvatarURL({ dynamic: true }) : null)
                .addFields(
                    { name: '👤 Username', value: data.username, inline: true },
                    { name: '🎮 Discord', value: discordUser ? `<@${data.discordId}>\n${discordUser.tag}` : data.discordId || 'Not set', inline: true },
                    { name: '🆔 Discord ID', value: data.discordId || 'Not set', inline: true },
                    { name: '🔑 HWID', value: data.hwid ? `\`${data.hwid}\`` : 'Not set', inline: false },
                    { name: '🔒 Password', value: data.hasPassword ? 'Set ✅' : 'Not set ❌', inline: true },
                    { name: '📅 Created At', value: createdAt.toLocaleDateString('en-GB'), inline: true },
                    { name: '⏰ Expires', value: expDate.toLocaleDateString('en-GB'), inline: true },
                    { name: '📊 Status', value: isExpired ? '❌ Expired' : `✅ Active`, inline: true },
                    { name: '⏳ Days Left', value: isExpired ? '0' : `${daysLeft} days`, inline: true },
                    { name: '📆 Account Age', value: `${Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))} days`, inline: true }
                )
                .setFooter({ text: `Requested by ${interaction.user.username} • ${interaction.user.id}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};