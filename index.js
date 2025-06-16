const {ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, GatewayIntentBits, EmbedBuilder} = require("discord.js");
const {token} = require("./config.json");
const swearWords = require("./censored.json");
const bannedWords = require("./banned.json");
const phrases = require("./phrases.json");

const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildWebhooks
]});

function isSwearWord(word) {
    var swear = swearWords;
    var characters = word.split("")
    for (const index in characters) {
        const char = characters[index];
        if (char === "*") break;

        if (swear) {
            swear = swear[char]
        } else {
            break;
        }
    }

    if (swear && swear["*"]) return swear["*"];

    return null;
}

function replaceAnySwears(text, swears) {
    const words = text.split(" ")
    for (const index in words) {
        const word = words[index];
        const replacement = isSwearWord(word);
        if (replacement) {
            newText = text.replace(word, replacement);
            swears.push(word)
            return replaceAnySwears(newText, swears);
        }
    }

    return [text, swears];
}

function isBannedWord(word) {
    var banned = bannedWords;
    var characters = word.split("")
    for (const index in characters) {
        const char = characters[index];
        if (char === "*") break;

        if (banned) {
            banned = banned[char]
        } else {
            break;
        }
    }

    return banned != null && "*" in banned;
}

function hasAnyBannedWords(text) {
    const words = text.split(" ")
    for (const index in words) {
        const word = words[index];
        const banned = isBannedWord(word);
        if (banned) return [true, word];
    }

    return [false, null];
}

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith("show_swears_")) {
        await interaction.deferReply()

        var dataArr = interaction.customId.substring(12).split("_")
        var originalAuthor = dataArr[0]
        var swears = dataArr[1]

        if (interaction.user.id != originalAuthor) {
            await interaction.editReply({ content: "You are not the original message author!" })
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .addFields({ name: "Filtered Words:", value: swears})
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] })
    }
})

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const bannedArr = hasAnyBannedWords(message.content);
    const hasBannedWords = bannedArr[0]
    if (hasBannedWords) {
        message.delete();
        return;
    }

    var message = message.content
    
    const swearArr = replaceAnySwears(message, []);
    const swearlessMessage = swearArr[0]
    const swears = swearArr[1]
    if (swears.length === 0) return;

    const button = new ButtonBuilder()
        .setCustomId("show_swears_" + message.author.id + "_" + swears.toString())
        .setLabel("Swears")
        .setStyle(ButtonStyle.Danger)

    const row = new ActionRowBuilder()
        .addComponents(button);

    message.delete()

    const webhook = await message.channel.createWebhook({
        channel: message.channel,
        name: message.author.displayName,
        reason: "Filtering Swears"
    });
    await webhook.send({ 
        content: swearlessMessage,
        avatarURL: message.author.displayAvatarURL(),
        components: [row]
    });
    webhook.delete("No Longer Needed");
});

client.login(token);