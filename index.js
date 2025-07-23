/*
Features: 
BuzzBot Allows users to create and setup a role by individually asking the user what role and then what emoji to display
for users to react to and get the role.

Commands:
!createrolemenu: prompts user to mention a pre-existing role then asks for an emoji to display
Bug Notes: Doesn't automatically show on Sidebar
*/

// multi_reaction_roles/index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const setupStage = {}; // Store reaction-role setup per user

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Step 1: Start role menu setup
  if (message.content === '!createrolemenu') {
    setupStage[message.author.id] = {
      step: 'askOptions',
      options: {},
      guildId: message.guild.id,
      channelId: message.channel.id,
    };
    return message.reply(
      'What emoji/role combos should I use? Submit them one at a time (Example: 🎮 @Gamer)\nType "done" when finished.'
    );
  }

  // Step 2: Process emoji/role pairs
  if (setupStage[message.author.id]?.step === 'askOptions') {
    const data = setupStage[message.author.id];
  
    if (message.content.toLowerCase() === 'done') {
      if (Object.keys(data.options).length === 0) {
        return message.reply('You must add at least one emoji/role pair before finishing.');
      }
  
      // Send role menu message (same as before) ...
      // [Your existing code here]
      return;
    }
  
    // Check limit before adding
    if (Object.keys(data.options).length >= 6) {
      return message.reply('You can only set up to 6 roles per menu.');
    }
  
    // Parse input: 🎮 @Gamer
    const parts = message.content.trim().split(/\s+/);
    const emoji = parts[0];
    const role = message.mentions.roles.first();
  
    if (!emoji || !role) {
      return message.reply('Please use the format: 🎮 @Gamer');
    }
  
    if (data.options[emoji]) {
      return message.reply('This emoji is already assigned to a role.');
    }
  
    data.options[emoji] = role.id;
    return message.reply(`Added ${emoji} → ${role.name}. Add more or type \"done\".`);
  }
  
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    for (const data of Object.values(setupStage)) {
      if (reaction.message.id === data.targetMessageId) {
        const roleId = data.options[reaction.emoji.name];
        if (!roleId) return;

        const guild = await client.guilds.fetch(data.guildId);
        const member = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get(roleId);

        if (role && !member.roles.cache.has(role.id)) {
          await member.roles.add(role);
          console.log(`✅ Gave ${role.name} to ${user.tag}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error adding role:', err);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    for (const data of Object.values(setupStage)) {
      if (reaction.message.id === data.targetMessageId) {
        const roleId = data.options[reaction.emoji.name];
        if (!roleId) return;

        const guild = await client.guilds.fetch(data.guildId);
        const member = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get(roleId);

        if (role && member.roles.cache.has(role.id)) {
          await member.roles.remove(role);
          console.log(`❌ Removed ${role.name} from ${user.tag}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error removing role:', err);
  }
});

client.login(process.env.TOKEN);