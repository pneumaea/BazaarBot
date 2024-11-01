import { Client, GatewayIntentBits, Partials } from "discord.js";
import { ready, interactionCreate, messageCreate } from "./listeners";
import * as Jobs from "./cronjobs/";
import cron from "node-cron";

import * as dotenv from "dotenv";
dotenv.config();

const client = new Client({
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const TOKEN = process.env.TOKEN;

declare global {
  interface Number {
    mod: (n: number) => {};
  }
}

Number.prototype.mod = function (n: number) {
  return (((this as number) % n) + n) % n;
};

/**
 * Discord Events
 */
ready(client);
interactionCreate(client);
messageCreate(client);

/**
 * Cron Jobs
 */
cron.schedule("*/30 * * * *", Jobs.UpdateBazaarEnergy, {
  timezone: "Europe/London",
});

cron.schedule("00 13 * * *", Jobs.UpdateCooldown, {
  timezone: "Europe/London",
});

cron.schedule("00 13 * * 0", Jobs.PVPReset_Weekly, {
  timezone: "Europe/London",
});

for (const tab of Jobs.monthlyTabs) {
  cron.schedule(tab, Jobs.PVPReset_Monthly, {
    timezone: "Europe/London",
  });
}

/**
 * LOGIN
 */
client.login(TOKEN);
