const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
require('colors');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

const loadCommands = () => {
   const commandsPath = path.join(__dirname, 'commands');
   const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

   client.commands.clear();
   const commands = [];

   for (const file of commandFiles) {
       const filePath = path.join(commandsPath, file);
       const command = require(filePath);
       client.commands.set(command.data.name, command);
       commands.push(command.data.toJSON());
   }
   return commands;
};

client.once('ready', async () => {
   console.log('[success] '.green + `${client.user.username.toLowerCase()} started.`);

   const commands = loadCommands();
   const clientID = process.env.CLIENT_ID;
   const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

   try {
       console.log('[success] '.green + 'Started updating application commands (/).');
       process.title = "beyondergg";
       
       await rest.put(Routes.applicationCommands(clientID), { body: commands });
       console.log('[success] '.green + 'Application commands (/) reloaded successfully.');
   } catch (error) {
       console.error('[error] '.black + 'Error reloading commands:', error);
   }

   client.user.setPresence({
       activities: [{ name: `beyondergg`, type: ActivityType.Playing }],
       status: 'dnd',
   });
});

client.on('interactionCreate', async interaction => {
   if (interaction.isCommand()) {
       const command = client.commands.get(interaction.commandName);

       if (!command) return;

       try {
           await command.execute(interaction);
       } catch (error) {
           console.error('[error] '.black + 'Error executing command:', error);
           await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
       }
   } else if (interaction.isSelectMenu() || interaction.isButton() || interaction.isModalSubmit()) {
       const commandName = interaction.message?.interaction?.commandName;
       const command = client.commands.get(commandName);

       if (command && command.handleInteraction) {
           try {
               await command.handleInteraction(client, interaction);
           } catch (error) {
               console.error('[error] '.black + 'Error processing button/modal interaction:', error);
               await interaction.reply({ content: 'There was an error processing the interaction!', ephemeral: true });
           }
       }
   }
});

client.login(process.env.TOKEN);