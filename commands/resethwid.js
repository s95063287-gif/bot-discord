const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const loadConfig = () => {
   try {
       const data = fs.readFileSync('config.txt', 'utf8');
       return JSON.parse(data);
   } catch (err) {
       console.error('Error reading configuration file:', err);
       return {};
   }
};

module.exports = {
   data: new SlashCommandBuilder()
       .setName('resethwid')
       .setDescription('Reset a HWID.')
       .addStringOption(option => 
           option.setName('hwid')
               .setDescription('The HWID to be reset')
               .setRequired(true))
       .setDMPermission(false)
       .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers), // Changed to more appropriate permission

   async execute(interaction) {
       const hwid = interaction.options.getString('hwid');
       const config = loadConfig();

       // Validate HWID format (basic validation)
       if (!hwid || hwid.trim().length === 0) {
           return await interaction.reply({ 
               content: `❌ | **Hello ${interaction.user}, please provide a valid HWID!**`, 
               ephemeral: true 
           });
       }

       // Check if support role ID is configured
       if (!config.SUPPORT_ROLE_ID) {
           console.error('SUPPORT_ROLE_ID not configured');
           return await interaction.reply({ 
               content: `❌ | **Command configuration error. Please contact the bot owner.**`, 
               ephemeral: true 
           });
       }

       // Check if user has support role
       if (!interaction.member.roles.cache.has(config.SUPPORT_ROLE_ID)) {
           return await interaction.reply({ 
               content: `😫 | **Hello ${interaction.user}, you don't have permission to use this command!**`, 
               ephemeral: true 
           });
       }

       // Validate API URL
       const apiUrl = process.env.API_URL;
       if (!apiUrl) {
           console.error('API_URL environment variable not set');
           return await interaction.reply({ 
               content: `❌ | **API configuration error. Please contact the bot owner.**`, 
               ephemeral: true 
           });
       }

       try {
           // Defer reply as API call might take time
           await interaction.deferReply({ ephemeral: true });

           const response = await axios.post(`${apiUrl}/reset-hwid`, {
               hwid
           }, {
               timeout: 10000 // 10 second timeout
           });

           // Check if response contains expected data
           const message = response.data?.message || 'HWID reset successfully.';
           
           // Truncate long HWIDs for display
           const displayHwid = hwid.length > 20 ? `${hwid.substring(0, 20)}...` : hwid;
           
           await interaction.editReply({ 
               content: `✅ | ${message} (HWID: ${displayHwid})` 
           });
       } catch (error) {
           console.error('Error resetting HWID:', error);
           
           let errorMessage = 'Unknown error occurred.';
           
           if (error.code === 'ECONNABORTED') {
               errorMessage = 'Request timed out. Please try again.';
           } else if (error.response?.data?.error) {
               errorMessage = error.response.data.error;
           } else if (error.response?.status === 404) {
               const displayHwid = hwid.length > 20 ? `${hwid.substring(0, 20)}...` : hwid;
               errorMessage = `HWID "${displayHwid}" not found.`;
           } else if (error.response?.status === 403) {
               errorMessage = 'API access denied.';
           } else if (error.response?.status === 400) {
               errorMessage = 'Invalid HWID format.';
           } else if (error.message) {
               errorMessage = error.message;
           }

           // If interaction was deferred, use editReply, otherwise use reply
           if (interaction.deferred) {
               await interaction.editReply({ 
                   content: `❌ | Error resetting HWID: **${errorMessage}**` 
               });
           } else {
               await interaction.reply({ 
                   content: `❌ | Error resetting HWID: **${errorMessage}**`, 
                   ephemeral: true 
               });
           }
       }
   }
};