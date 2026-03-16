const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const generateKey = (duration) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = (len) => Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    const prefixes = {
        '1day':      'KDAY',
        '1week':     'KWEEK',
        '1month':    'KMONTH',
        '3month':    'K3MONTH',
        'permanent': 'KLIFETIME',
        '10year':    'K10YEAR',
        '2min':      'KTEST'
    };

    const prefix = prefixes[duration] || 'KAIRO';
    return `${prefix}-${segment(4)}-${segment(4)}`;
};

const OWNER_IDS = process.env.OWNER_IDS
    ? process.env.OWNER_IDS.split(',').map(id => id.trim())
    : [];
const API_URL = process.env.API_URL;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generatekey')
        .setDescription('Generate a new key')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false)
        .addStringOption(option =>
            option
                .setName('duration')
                .setDescription('Key duration')
                .setRequired(true)
                .addChoices(
                    { name: '1 day', value: '1day' },
                    { name: '1 week', value: '1week' },
                    { name: '1 month', value: '1month' },
                    { name: '3 months', value: '3month' },
                    { name: 'permanent', value: 'permanent' },
                    { name: 'Test (2min)', value: '2min' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const duration = interaction.options.getString('duration');
        const key = generateKey(duration);

        const isOwner = OWNER_IDS.includes(interaction.user.id);
        const isAdmin = interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);

        if (!isOwner && !isAdmin) {
            return interaction.editReply({
                content: `😫 | Only **Administrators** can use this command!`
            });
        }

        if (!API_URL) {
            return interaction.editReply({
                content: '❌ API_URL is not set in environment variables.'
            });
        }

        try {
            await axios.post(`${API_URL}/api/generate-key`, { key, duration });

            return interaction.editReply({
                content: `✅ Key generated successfully!\n\`${key}\``
            });
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error.';
            return interaction.editReply({
                content: `❌ Error generating key: ${errorMsg}`
            });
        }
    }
};