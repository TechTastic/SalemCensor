const {Client, GatewayIntentBits, EmbedBuilder} = require("discord.js");
const {token} = require("./config.json");
const {swears} = require("./censored.json");

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
        message = message.concat("`").concat(matches[index]).concat("`")
        if (index != matches.length - 1) {
            message = message.concat(", ")
        }
        if (index == matches.length - 2) {
            message = message.concat("and ")
        }
    }

    if (matches.length > 1) {
        message = message.concat(" are swears ")
    } else {
        message = message.concat(" is a swear ")
    }

    return message.concat("according to the Town of Salem censor!")
}

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    
    var newContent = message.content;
    var matches = [];
    for (const swear in swears) {
        const match = newContent.match(new RegExp(swear, "g"));
        if (match && match.length > 0) {
            for (const swearInText of match) {
                newContent = newContent.replace(swearInText, swears[swear]);

                if (!matches.find((value, string, obj) => { value === string }, swearInText)) {
                    matches.push(swearInText)
                }
            }
        }
    }

    if (matches.length > 0) {
        // Delete Original Message
        message.delete();

        // Create DM Warning Message
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

        // Send DM about the used swears
        const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .addFields({ name: "You Swore on **".concat(message.guild.name).concat("** !"), value: warning})
        .setTimestamp();
        message.author.send({ embeds: [embed] });
    }
});

client.login(token);