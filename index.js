const {Client, GatewayIntentBits, EmbedBuilder} = require("discord.js");
const {token} = require("./config.json");
const {swears} = require("./censored.json");
const {banned} = require("./banned.json");

const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildWebhooks
]});

function makeWarningMessage(matches) {
    var message = "";
    for (const index in matches) {
        message = message.concat("`").concat(matches[index]).concat("`");
        if (index != matches.length - 1) {
            message = message.concat(", ");
        }
        if (index == matches.length - 2) {
            message = message.concat("and ");
        }
    }

    if (matches.length > 1) {
        message = message.concat(" are swears ");
    } else {
        message = message.concat(" is a swear ");
    }

    return message.concat("according to the Town of Salem censor!");
}

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    var banned = [];
    for (const word in banned) {
        const match = message.content.match(new RegExp(word, "g"));

        for (bannedInText in match) {
            if (!banned.find((value, string, obj) => { value === string }, bannedInText)) {
                banned.push(bannedInText);
            }
        }
    }
    
    var newContent = message.content;
    var matches = [];
    for (const swear in swears) {
        if (banned.length > 0) break;
        const match = newContent.match(new RegExp(swear, "g"));
        for (const swearInText of match) {
            newContent = newContent.replace(swearInText, swears[swear]);

            if (!matches.find((value, string, obj) => { value === string }, swearInText)) {
                matches.push(swearInText)
            }
        }
    }

    // Message Contains no Censored or Banned Words
    if (matches.length == 0 && banned.length == 0) return;

    
    // Delete Original Message
    message.delete();

    // Message Contained Banned Words?
    if (banned.length > 0) {

        // Create Warning Message
        var warning = banned.join(", ");
        var temp = warning.substring(0, banned.lastIndexOf(", "));
        warning = temp.concat(" and ").concat(warning.substring(temp.length + 2, warning.length));
        if (banned.length > 1) warning = warning.concat(" are ");
        else warning = warning.concat(" is ");
        warning = warning.concat(" banned by **Salem Censor**");

        // Create and Send Embedded DM
        const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .addFields({ name: "You said banned words on **".concat(message.guild.name).concat("**!"), value: warning})
        .setTimestamp();
        message.author.send({ embeds: [embed] });

        return;
    }


    // Message Contains Censored Words

    // Create Warning Message
    const warning = makeWarningMessage(matches);

    // Create Imitation Webhook and Resend Message Sanitized
    const webhook = await message.channel.createWebhook({
        channel: message.channel,
        name: message.author.displayName,
        reason: "Filtering Swears"
    });
    await webhook.send({ content: newContent,
        avatarURL: message.author.displayAvatarURL()
    });
    webhook.delete("No Longer Needed");

    // Send embedded DM warning about the used swears
    const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .addFields({ name: "You Swore on **".concat(message.guild.name).concat("**!"), value: warning})
    .setTimestamp();
    message.author.send({ embeds: [embed] });
});


client.login(token);