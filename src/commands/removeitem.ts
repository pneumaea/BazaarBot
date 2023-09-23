import { Client, CommandInteraction } from "discord.js";
import CommandOptions from "../enums/CommandOptions";
import { Command } from "./ICommand";
import Item from "../Classes/Item";
import { EmbedBuilder } from "discord.js";
import fs from "node:fs";
import * as Database from "../Database";
import AccessValidator from "../Classes/AccessValidator";

export const removeitem: Command = {
  name: "removeitem",
  description: "Removes an item from the shop",
  options: [
    {
      name: "code",
      type: CommandOptions.STRING,
      description: "The Code of the pack",
      required: true,
    },
  ],
  async execute(client: Client, interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const db = Database.init();
    const { rows: accessEntry } = await db.query(`SELECT level FROM accesslevel WHERE id=$1`, [
      interaction.user.id,
    ]);
    if (accessEntry.length === 0 || !new AccessValidator(accessEntry[0].level, "ADMIN").validate())
      return interaction.reply({
        content: "Invalid Authorisation.",
        ephemeral: true,
      });

    let itemCode = interaction.options.getString("code");
    let shopItems = JSON.parse(fs.readFileSync("./data/shop.json", "utf-8"));
    const droppool = JSON.parse(fs.readFileSync("./data/droppool.json", "utf-8"));

    let itemInShop = shopItems.find((e: Item) => e.code === itemCode) !== undefined;
    if (!itemInShop)
      return interaction.reply({
        content: `The item with the ID \`${itemCode}\` is not in the shop.`,
        ephemeral: true,
      });

    let itemIndex = droppool.findIndex((e: Item) => e.code === itemCode);
    if (itemIndex < 0)
      return interaction.reply({
        content: `There is no item with the ID \`${itemCode}\` in the droppool.`,
        ephemeral: true,
      });

    shopItems.splice(itemIndex, 1);
    fs.writeFileSync("./data/shop.json", JSON.stringify(shopItems, null, "\t"));

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Updated Shop")
          .setColor("Green")
          .setDescription(`Successfully removed \`${itemCode}\` from the shop.`),
      ],
    });
  },
};
