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
       .setName('removelogin')
       .setDescription('Remove a login')
       .addStringOption(option => 
           option.setName('id')
               .setDescription('ID of the login to remove')
               .setRequired(true))
       .setDMPermission(false)
       .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers), // Changed to more appropriate permission

   async execute(interaction) {
       const id = interaction.options.getString('id');
       const config = loadConfig();

       // Validate ID format (basic validation)
       if (!id || id.trim().length === 0) {
           return await interaction.reply({ 
               content: `❌ | **Hello ${interaction.user}, please provide a valid ID!**`, 
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

           const response = await axios.delete(`${apiUrl}/remove-login`, {
               data: { id },
               timeout: 10000 // 10 second timeout
           });

           // Check if response contains expected data
           const username = response.data?.username || 'Unknown';
           
           await interaction.editReply({ 
               content: `✅ | Login removed successfully: **${username}** (ID: ${id})` 
           });
       } catch (error) {
           console.error('Error removing login:', error);
           
           let errorMessage = 'Unknown error occurred.';
           
           if (error.code === 'ECONNABORTED') {
               errorMessage = 'Request timed out. Please try again.';
           } else if (error.response?.data?.error) {
               errorMessage = error.response.data.error;
           } else if (error.response?.status === 404) {
               errorMessage = `Login with ID "${id}" not found.`;
           } else if (error.response?.status === 403) {
               errorMessage = 'API access denied.';
           } else if (error.message) {
               errorMessage = error.message;
           }

           // If interaction was deferred, use editReply, otherwise use reply
           if (interaction.deferred) {
               await interaction.editReply({ 
                   content: `❌ | Error removing login: **${errorMessage}**` 
               });
           } else {
               await interaction.reply({ 
                   content: `❌ | Error removing login: **${errorMessage}**`, 
                   ephemeral: true 
               });
           }
       }
   }
};