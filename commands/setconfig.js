const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setconfig')
        .setDescription('Update app configuration')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(o => o.setName('key').setDescription('Config key').setRequired(true)
            .addChoices(
                { name: 'Maintenance Mode', value: 'maintenanceMode' },
                { name: 'Offline Mode', value: 'offlineMode' },
                { name: 'Allow Registrations', value: 'allowNewRegistrations' },
                { name: 'Maintenance Message', value: 'maintenanceMessage' },
                { name: 'Version', value: 'version' },
                { name: 'Required Version', value: 'requiredVersion' },
                { name: 'MOTD', value: 'motd' },
                { name: 'Discord URL', value: 'discordUrl' },
                { name: 'Max Users', value: 'maxUsers' }
            ))
        .addStringOption(o => o.setName('value').setDescription('New value').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const key = interaction.options.getString('key');
        const rawValue = interaction.options.getString('value');

        let value;
        if (rawValue === 'true') value = true;
        else if (rawValue === 'false') value = false;
        else if (!isNaN(rawValue)) value = Number(rawValue);
        else value = rawValue;

        try {
            await axios.post(`${process.env.API_URL}/api/config/update`, {
                secret: process.env.CONFIG_SECRET,
                [key]: value
            });

            await interaction.editReply({
                content: `✅ Config updated!\n\`${key}\` → \`${rawValue}\``
            });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            await interaction.editReply({ content: `❌ Error: ${msg}` });
        }
    }
};