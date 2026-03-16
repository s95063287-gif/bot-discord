const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listusers')
        .setDescription('List all registered users')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(o => o.setName('filter').setDescription('Filter users').setRequired(false)
            .addChoices(
                { name: 'All', value: 'all' },
                { name: 'Active', value: 'active' },
                { name: 'Expired', value: 'expired' },
                { name: 'Banned', value: 'banned' }
            ))
        .addIntegerOption(o => o.setName('page').setDescription('Page number').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const filter = interaction.options.getString('filter') || 'all';
        const page = interaction.options.getInteger('page') || 1;
        const perPage = 10;

        try {
            const { data } = await axios.get(`${process.env.API_URL}/api/listusers`);

            const now = new Date();
            let users = data.users;

            // Filter anwenden
            if (filter === 'active') {
                users = users.filter(u => new Date(u.expirationDate) > now && !u.hwidBanned);
            } else if (filter === 'expired') {
                users = users.filter(u => new Date(u.expirationDate) <= now);
            } else if (filter === 'banned') {
                users = users.filter(u => u.hwidBanned);
            }

            const total = users.length;
            const totalPages = Math.ceil(total / perPage);
            const start = (page - 1) * perPage;
            const paged = users.slice(start, start + perPage);

            if (paged.length === 0) {
                return interaction.editReply({ content: `❌ No users found for filter: **${filter}**` });
            }

            // Stats berechnen
            const activeCount  = data.users.filter(u => new Date(u.expirationDate) > now && !u.hwidBanned).length;
            const expiredCount = data.users.filter(u => new Date(u.expirationDate) <= now).length;
            const bannedCount  = data.users.filter(u => u.hwidBanned).length;

            // User Liste
            const userList = paged.map((u, i) => {
                const exp = new Date(u.expirationDate);
                const isExpired = exp <= now;
                const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
                const status = u.hwidBanned ? '🔨' : isExpired ? '❌' : '✅';
                const expStr = isExpired ? 'Expired' : `${daysLeft}d left`;

                return `${status} **${start + i + 1}.** \`${u.username}\`\n` +
                       `┣ 📅 Expires: ${exp.toLocaleDateString('en-GB')}\n` +
                       `┣ ⏳ ${expStr}\n` +
                       `┗ 🎮 Discord: ${u.discordId ? `<@${u.discordId}>` : 'Not linked'}`;
            }).join('\n\n');

            const embed = new EmbedBuilder()
                .setTitle(`👥 User List`)
                .setColor(
                    filter === 'banned'  ? 0xFF0000 :
                    filter === 'expired' ? 0xFFA500 :
                    filter === 'active'  ? 0x57F287 : 0x5865F2
                )
                .setDescription(userList)
                .addFields(
                    { name: '📊 Total', value: `${data.total}`, inline: true },
                    { name: '✅ Active', value: `${activeCount}`, inline: true },
                    { name: '❌ Expired', value: `${expiredCount}`, inline: true },
                    { name: '🔨 Banned', value: `${bannedCount}`, inline: true },
                    { name: '🔍 Filter', value: filter.charAt(0).toUpperCase() + filter.slice(1), inline: true },
                    { name: '📄 Page', value: `${page}/${totalPages}`, inline: true }
                )
                .setFooter({ text: `Requested by ${interaction.user.username} • Showing ${start + 1}-${Math.min(start + perPage, total)} of ${total}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};