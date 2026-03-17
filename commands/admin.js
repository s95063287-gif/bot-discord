const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub
            .setName('reset-all-hwids')
            .setDescription('Reset all HWIDs')
        )
        .addSubcommand(sub => sub
            .setName('unban-all')
            .setDescription('Remove all bans')
        )
        .addSubcommand(sub => sub
            .setName('add-days-all')
            .setDescription('Add days to all users')
            .addIntegerOption(o => o.setName('days').setDescription('Days to add').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('add-days-user')
            .setDescription('Add days to a specific user')
            .addStringOption(o => o.setName('username').setDescription('Username').setRequired(true))
            .addIntegerOption(o => o.setName('days').setDescription('Days to add').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('reset-all-keys')
            .setDescription('Reset all keys to unused')
        )
        .addSubcommand(sub => sub
            .setName('delete-expired')
            .setDescription('Delete all expired users')
        )
        .addSubcommand(sub => sub
            .setName('stats')
            .setDescription('Show server stats')
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const sub = interaction.options.getSubcommand();

        try {
            if (sub === 'stats') {
                const { data } = await axios.get(`${process.env.API_URL}/api/admin/stats`, {
                    headers: { 'x-secret': process.env.CONFIG_SECRET }
                });

                const embed = new EmbedBuilder()
                    .setTitle('📊 Server Statistics')
                    .setColor(0x5865F2)
                    .addFields(
                        { name: '👥 Total Users', value: `${data.users.total}`, inline: true },
                        { name: '✅ Active', value: `${data.users.active}`, inline: true },
                        { name: '❌ Expired', value: `${data.users.expired}`, inline: true },
                        { name: '🔨 Banned Users', value: `${data.users.banned}`, inline: true },
                        { name: '🔑 Total Keys', value: `${data.keys.total}`, inline: true },
                        { name: '✅ Used Keys', value: `${data.keys.used}`, inline: true },
                        { name: '🆓 Unused Keys', value: `${data.keys.unused}`, inline: true },
                        { name: '🔨 Banned Keys', value: `${data.keys.banned}`, inline: true }
                    )
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            // Confirm für gefährliche Aktionen
            const dangerous = ['reset-all-hwids', 'unban-all', 'reset-all-keys', 'delete-expired'];
            if (dangerous.includes(sub)) {
                // Direkt ausführen
            }

            let data;
            const body = { secret: process.env.CONFIG_SECRET };

            if (sub === 'add-days-all') {
                body.days = interaction.options.getInteger('days');
            } else if (sub === 'add-days-user') {
                body.username = interaction.options.getString('username');
                body.days = interaction.options.getInteger('days');
            }

            const response = await axios.post(
                `${process.env.API_URL}/api/admin/${sub}`,
                body
            );
            data = response.data;

            const embed = new EmbedBuilder()
                .setTitle(`⚙️ Admin — ${sub}`)
                .setColor(0x57F287)
                .setDescription(`✅ ${data.message}`)
                .addFields(
                    ...Object.entries(data)
                        .filter(([k]) => k !== 'message')
                        .map(([k, v]) => ({ 
                            name: k, 
                            value: String(v), 
                            inline: true 
                        }))
                )
                .setFooter({ text: `Executed by ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};