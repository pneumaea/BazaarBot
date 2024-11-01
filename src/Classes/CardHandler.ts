import { ButtonBuilder, ButtonStyle, Client, CommandInteraction } from "discord.js";
import Inventory from "./Inventory";
import Item from "./Item";
import { Cooldown } from "../types";

import {
  EmbedBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputStyle,
} from "discord.js";
import * as helper from "../ext/Helper";
import fs from "fs";
import { Currency } from "../types/DBTypes";

const applyGemBonus = (inv: Inventory, baseValue: number) => {
  let item = [...inv.getItems(), ...inv.getActiveItems()].find((e: any) => e.id === 40);
  if (!item) return baseValue;

  return Math.round(baseValue * 1.1);
};

/**
 * Common
 * Mahols Hut
 * Gain +5 gems when using /bz daily
 */
const handleCard23 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const baseReward = 3;

  const inv = await helper.fetchInventory(interaction.user.id);
  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  if ((card.cardType as Cooldown).cooldown?.current > 0) return { error: true };

  const query = `SELECT * FROM currency WHERE id=$1`;
  let points = await db.query(query, [interaction.user.id]);

  if (points.rows.length > 0) {
    var reward = applyGemBonus(inv, baseReward);
    var newBalance = points.rows[0].gems + reward;

    const query = `UPDATE currency SET gems=$1 WHERE id=$2`;
    db.query(query, [newBalance, interaction.user.id]);
  } else {
    const query = `INSERT INTO currency VALUES($1,$2,$3,$4)`;
    db.query(query, [interaction.user.id, 0, baseReward, 0]);
  }

  card.resetCooldown();
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return { error: false, reward: baseReward, type: "gems" };
};

/**
 * Common
 * Fragile Vase
 * +10% reward from the task (gold/gems)
 */
const handleCard24 = async (card: Item, db: any, interaction: CommandInteraction) => {
  let inv = await helper.fetchInventory(interaction.user.id);

  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  inv.setActiveItem(card);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully used card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Common
 * Green Artifact
 * Gain a random celestial card on use
 */
const handleCard25 = async (card: Item, db: any, interaction: CommandInteraction) => {
  if (card.amount < 25)
    return interaction.editReply({
      content: `You can only use this card if you have 25 duplicates.\nYou currently own ${card.amount} duplicates.`,
    });

  let inv = await helper.fetchInventory(interaction.user.id);
  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  const droppool = (await helper.fetchDroppool())[0];
  const celestialCards = [...droppool.items].filter(
    (e: any) => e.rarity.toLowerCase() === "celestial"
  );
  const randomCelestial = celestialCards[Math.floor(Math.random() * celestialCards.length)];
  randomCelestial.amount = 1;

  inv.removeItem(card, 25);
  inv.addItem(randomCelestial);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Card Used")
        .setColor("Green")
        .setDescription(
          `Successfully used card \`${card.name}\`.\nYou received one \`${randomCelestial.name}\`.\nYou now own ${card.amount} duplicates of \`${card.name}\`.`
        ),
    ],
  });
};

/**
 * Rare
 * Game Center
 * 50/50 chance to gain +100% reward or pay the Bazaar the reward
 */
const toggleCard28 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = await helper.fetchInventory(interaction.user.id);
  const isActive = inv.getActiveItems().find((e: any) => e.id === card.id) !== undefined;
  const action = isActive ? "disabled" : "enabled";

  const foundCard = [...inv.getActiveItems(), ...inv.getItems()].find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  inv.setActiveItem(card);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully ${action} card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Rare
 * Job
 * Gain +7 gems when using /bz daily
 */
const handleCard29 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const baseValue = 7;

  const inv = await helper.fetchInventory(interaction.user.id);
  if ((card.cardType as Cooldown).cooldown?.current > 0) return { error: true };

  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  const query = `SELECT * FROM currency WHERE id=$1`;
  let points = await db.query(query, [interaction.user.id]);

  if (points.rows.length > 0) {
    var reward = applyGemBonus(inv, baseValue);
    var newBalance = points.rows[0].gems + reward;

    const query = `UPDATE currency SET gems=$1 WHERE id=$2`;
    db.query(query, [newBalance, interaction.user.id]);
  } else {
    const query = `INSERT INTO currency VALUES($1,$2,$3,$4)`;
    db.query(query, [interaction.user.id, 0, baseValue, 0]);
  }

  card.resetCooldown();
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return { error: false, reward: baseValue, type: "gems" };
};

/**
 * Rare
 * Scorpion Claw
 * Multiplies passive card buffs by 50% for 1 day
 */
const handleCard30 = async (
  card: Item,
  db: any,
  interaction: CommandInteraction,
  client: Client
) => {
  const inv = await helper.fetchInventory(interaction.user.id);
  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  if ((card.cardType as Cooldown).cooldown?.current > 0)
    return interaction.editReply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
    });

  let { input, interaction: newInteraction } = await helper.getModalInput(client, interaction, {
    label: "User ID",
    title: "Please provide a user to target.",
  });
  if (!/\d+/.test(input))
    return newInteraction.reply({
      content: "Invalid user id.",
      ephemeral: true,
    });

  let user = await client.users.fetch(input).catch(() => {});
  if (!user)
    return newInteraction.reply({
      content: `Could not fetch user by id \`${input}\`.`,
      ephemeral: true,
    });
  if (user.bot)
    return newInteraction.reply({
      content: `You cannot target bots with this card.`,
      ephemeral: true,
    });

  card.targetUser = user;
  card.resetCooldown();
  inv.setActiveItem(card);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return newInteraction
    .reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `${helper.emoteApprove} ${helper.separator} ${interaction.user} just used card \`${card.name}\` and targeted ${user}.`
          ),
      ],
    })
    .catch(() => {});
};

/**
 * Rare
 * Folen the Healer
 * Removes dubuffs from target player
 */
const handleCard31 = (card: Item, db: any, interaction: CommandInteraction) => {
  return interaction.editReply(
    `Card Interaction for \`${card.name}\` has not been implemented yet.`
  );
};

/**
 * Rare
 * Dumping Grounds
 * Lose 3 scrap gain one Base Set pack (scrap needed to use)
 */
const handleCard32 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const scrapCost = 3;

  if ((card.cardType as Cooldown).cooldown?.current > 0)
    return interaction.editReply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
    });

  const inv = await helper.fetchInventory(interaction.user.id);
  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  let query = `SELECT scrap FROM currency WHERE id=$1`;
  let balance = await db.query(query, [interaction.user.id]);
  if (balance.rows.length === 0)
    return interaction.editReply({
      content: `You have no points.`,
    });

  const { scrap } = balance.rows[0];
  if (scrap < scrapCost)
    return interaction.editReply({
      content: `You can not afford this item. You only have ${scrap} scrap.`,
    });

  let newBalance = scrap - scrapCost;
  query = `UPDATE currency SET scrap=$1 WHERE id=$2`;
  db.query(query, [newBalance, interaction.user.id]);

  const droppool = await helper.fetchDroppool();
  let dropPoolIndex = droppool.findIndex((e: any) => e.code === "alpha");
  let cardPool = {
    common: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity.toLowerCase() === "common"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.common),
    },
    rare: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity.toLowerCase() === "rare"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.rare),
    },
    legendary: {
      pool: droppool[dropPoolIndex].items.filter(
        (e: any) => e.rarity.toLowerCase() === "legendary"
      ),
      chance: parseFloat(droppool[dropPoolIndex].rarities.legendary),
    },
    celestial: {
      pool: droppool[dropPoolIndex].items.filter(
        (e: any) => e.rarity.toLowerCase() === "celestial"
      ),
      chance: parseFloat(droppool[dropPoolIndex].rarities.celestial),
    },
  };

  let reward;
  let roll = Math.random() * 1;
  if (roll <= cardPool.celestial.chance) reward = helper.randomPick(cardPool.celestial.pool);
  else if (roll <= cardPool.legendary.chance) reward = helper.randomPick(cardPool.legendary.pool);
  else if (roll <= cardPool.rare.chance) reward = helper.randomPick(cardPool.rare.pool);
  else reward = helper.randomPick(cardPool.common.pool);

  inv.addItem(reward);
  card.resetCooldown();
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Card Used")
        .setColor("Green")
        .setDescription(
          `You have successfully used \`${card.name}\` and gained one \`${reward.name}\` \`(${reward.code})\``
        ),
    ],
  });
};

/**
 * Rare
 * Crafting
 * Gain one Base Set Card and 10 exp
 */
const handleCard33 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const expAmount = 10;

  const inv = await helper.fetchInventory(interaction.user.id);
  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  if ((card.cardType as Cooldown).cooldown?.current > 0)
    return interaction.editReply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
    });

  const droppool = await helper.fetchDroppool();

  let dropPoolIndex = droppool.findIndex((e: any) => e.code === "alpha");
  let cardPool = {
    common: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity.toLowerCase() === "common"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.common),
    },
    rare: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity.toLowerCase() === "rare"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.rare),
    },
    epic: {
      pool: droppool[dropPoolIndex].items.filter((e: any) => e.rarity.toLowerCase() === "epic"),
      chance: parseFloat(droppool[dropPoolIndex].rarities.epic),
    },
    legendary: {
      pool: droppool[dropPoolIndex].items.filter(
        (e: any) => e.rarity.toLowerCase() === "legendary"
      ),
      chance: parseFloat(droppool[dropPoolIndex].rarities.legendary),
    },
    celestial: {
      pool: droppool[dropPoolIndex].items.filter(
        (e: any) => e.rarity.toLowerCase() === "celestial"
      ),
      chance: parseFloat(droppool[dropPoolIndex].rarities.celestial),
    },
  };

  let reward;
  let roll = Math.random() * 1;
  if (roll <= cardPool.celestial.chance) reward = helper.randomPick(cardPool.celestial.pool);
  else if (roll <= cardPool.legendary.chance) reward = helper.randomPick(cardPool.legendary.pool);
  else if (roll <= cardPool.rare.chance) reward = helper.randomPick(cardPool.rare.pool);
  else reward = helper.randomPick(cardPool.common.pool);

  inv.addItem(reward);

  card.resetCooldown();
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);
  helper.updateTotalEXP(interaction, db, 1, expAmount);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Card Used")
        .setColor("Green")
        .setDescription(
          `You have successfully used \`${card.name}\` and gained one \`${reward.name}\` \`(${reward.code})\` and ${expAmount} exp ${helper.emoteLevels}`
        ),
    ],
  });
};

/**
 * Rare
 * Horse and Carriage
 * Bypass a tasks location requirement
 */
const handleCard34 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = await helper.fetchInventory(interaction.user.id);

  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  if ((card.cardType as Cooldown).cooldown?.current > 0)
    return interaction.editReply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
    });

  card.resetCooldown();
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Card Used")
        .setColor("Green")
        .setDescription(`Successfully used card \`${card.name}\``),
    ],
  });
};

/**
 * Rare
 * NPC
 * Gain +50 exp when using /bz daily
 */
const handleCard35 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const reward = 50;
  const inv = await helper.fetchInventory(interaction.user.id);
  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  let used = card.use();
  if (!used) return { error: true };

  card.resetCooldown();
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  const query = `SELECT * FROM BazaarStats WHERE id=$1`;
  let currentEXP = await db.query(query, [interaction.user.id]);

  if (currentEXP.rows.length > 0) {
    currentEXP = currentEXP.rows[0];

    let newTotal = parseInt(currentEXP.exp) + reward;

    let formerLevel = helper.getLevelData(currentEXP.exp).level;
    let levelNow = helper.getLevelData(newTotal).level;

    if (levelNow > formerLevel) {
      helper.addScrap(interaction.user, db, levelNow);
      interaction.channel?.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `${helper.emoteLevels} ${helper.separator} ${interaction.user} just leveled up and gained ${levelNow} scrap ${helper.emoteScrap}! They are now level ${levelNow}.`
            ),
        ],
      });
    }

    const query = `UPDATE BazaarStats SET exp=$1 WHERE id=$2`;
    db.query(query, [newTotal, interaction.user.id]);
  } else {
    const query = `INSERT INTO BazaarStats VALUES($1,$2,$3,$4,$5)`;
    db.query(query, [
      interaction.user.id,
      JSON.stringify({}),
      reward,
      0,
      JSON.stringify({ global: null, personal: null }),
    ]);
  }

  return { error: false, reward: reward, type: "exp" };
};

/**
 * Rare
 * Crystal
 * +25% reward from the task (gold/gems)
 */
const handleCard36 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = await helper.fetchInventory(interaction.user.id);

  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  inv.setActiveItem(card);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully used card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Rare
 * Orphanage
 * whatever
 */
const handleCard38 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = await helper.fetchInventory(interaction.user.id);

  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  inv.setActiveItem(card);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully used card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Rare
 * Human Remains
 * Gain between 15 and 30 gems
 */
const handleCard37 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const min = 15;
  const max = 30;

  const query = `SELECT * FROM currency WHERE id=$1`;
  let points = await db.query(query, [interaction.user.id]);

  let inv = await helper.fetchInventory(interaction.user.id);
  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  if (points.rows.length > 0) {
    let { gems } = points.rows[0];

    let reward = applyGemBonus(inv, Math.round(Math.random() * (max - min) + min));
    gems += reward;

    const query = `UPDATE currency SET gems=$1 WHERE id=$2`;
    db.query(query, [gems, interaction.user.id]);

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `Successfully used card \`${
              card.name
            }\`\n\nRewards: ${reward.toLocaleString()} gems<:bgem:1109529198227361872>\nNew Balance: ${gems.toLocaleString()} gems<:bgem:1109529198227361872>`
          ),
      ],
    });
  } else {
    const reward = Math.round(Math.random() * (max - min) + min);
    let gems = applyGemBonus(inv, reward);

    const query = `INSERT INTO currency VALUES($1,$2,$3,$4)`;
    db.query(query, [interaction.user.id, 0, gems, 0]);

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `Successfully used card \`${
              card.name
            }\`\n\nRewards: ${reward.toLocaleString()} gems<:bgem:1109529198227361872>\nNew Balance: ${gems.toLocaleString()} gems<:bgem:1109529198227361872>`
          ),
      ],
    });
  }

  inv.removeItem(card);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);
};

/**
 * Rare
 * Collection
 * Gain gems equal to 2*(unique cards owned)
 */
const handleCard39 = async (card: Item, db: any, interaction: CommandInteraction) => {
  let points = await db.query(`SELECT * FROM currency WHERE id=$1`, [interaction.user.id]);

  let inv = await helper.fetchInventory(interaction.user.id);
  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  let uniqueItems = inv.getItems().length + inv.getActiveItems().length;

  if (points.rows.length > 0) {
    let { gems } = points.rows[0];
    let reward = uniqueItems * 2;
    gems += applyGemBonus(inv, reward);

    const query = `UPDATE currency SET gems=$1 WHERE id=$2`;
    db.query(query, [gems, interaction.user.id]);

    inv.removeItem(card);
    inv.setUserId(interaction.user.id);
    helper.updateInventoryRef(inv);

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Card Used")
          .setColor("Green")
          .setDescription(
            `Successfully used card \`${
              card.name
            }\`\n\nRewards: ${reward.toLocaleString()} gems<:bgem:1109529198227361872>\nNew Balance: ${gems.toLocaleString()} gems<:bgem:1109529198227361872>`
          ),
      ],
    });
  } else {
    let reward = applyGemBonus(inv, uniqueItems * 2);

    const query = `INSERT INTO currency VALUES($1,$2,$3,$4)`;
    db.query(query, [interaction.user.id, 0, reward, 0]);

    inv.removeItem(card);
    inv.setUserId(interaction.user.id);
    helper.updateInventoryRef(inv);

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Card Used")
          .setColor("Green")
          .setDescription(
            `Successfully used card \`${
              card.name
            }\`\n\nRewards: ${reward.toLocaleString()} gems<:bgem:1109529198227361872>\nNew Balance: ${reward.toLocaleString()} gems<:bgem:1109529198227361872>`
          ),
      ],
    });
  }
};

/**
 * Rare
 * Colosseum
 * Enables /bz attack (@player) command allowing for pvp
 */
const toggleCard40 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = await helper.fetchInventory(interaction.user.id);
  const foundCard = [...inv.getItems(), ...inv.getActiveItems()].find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  const isActive = inv.getActiveItems().find((e: any) => e.id === card.id) !== undefined;
  const action = isActive ? "disabled" : "enabled";

  inv.setActiveItem(card);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully ${action} card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Legendary
 * Bank
 * Gain 5% interest on your Gems when using /bz daily (capped at 10/day)
 */
const handleCard44 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const cap = 10;

  if ((card.cardType as Cooldown).cooldown?.current > 0) return { error: true };

  const inv = await helper.fetchInventory(interaction.user.id);
  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  let query = `SELECT * FROM currency WHERE id=$1`;
  let points = await db.query(query, [interaction.user.id]);

  if (points.rows.length === 0 || points.rows[0].gems <= 0) return { error: true };

  let gains = Math.round(applyGemBonus(inv, Math.round(points.rows[0].gems * 0.05)));
  if (gains < 1) return { error: true };
  if (gains > cap) gains = cap;
  let newBalance = points.rows[0].gems + gains;

  query = `UPDATE currency SET gems=$1 WHERE id=$2`;
  db.query(query, [newBalance, interaction.user.id]);

  card.resetCooldown();
  const invIndex = inv.getItems().findIndex((e) => e.id === card.id);
  if (invIndex >= 0) inv.list[invIndex] = card;
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return { error: false, reward: gains, type: "gems" };
};

/**
 * Legendary
 * O'Lo
 * Reduce cooldown of cards by 1
 */
const handleCard45 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = await helper.fetchInventory(interaction.user.id);
  const allItems = [...inv.getItems()];

  if ((card.cardType as Cooldown).cooldown?.current > 0)
    return interaction.editReply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
    });

  const dailyCard = [23, 29, 35, 44];
  for (const item of allItems) {
    if (dailyCard.includes(item.id)) continue; // don't reduce daily gem cards

    item.turn();
  }

  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });

  foundCard.resetCooldown();
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Card Used")
        .setColor("Green")
        .setDescription(`Successfully used card \`${card.name}\``),
    ],
  });
};

/**
 * Legendary
 * Snail Shell
 * Add 3 minutes to target players winning time
 */
const handleCard46 = async (
  card: Item,
  db: any,
  interaction: CommandInteraction,
  client: Client
) => {
  const inv = await helper.fetchInventory(interaction.user.id);
  const cardName = card.name;

  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${cardName}\`.`,
    });
  card = foundCard;

  if ((card.cardType as Cooldown).cooldown?.current > 0)
    return interaction.editReply({
      content: `Could not use card \`${
        card.name
      }\` because it's currently on cooldown.\nIt is on cooldown for ${
        (card.cardType as Cooldown).cooldown.current
      } more ${(card.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
    });

  let { input, interaction: newInteraction } = await helper.getModalInput(client, interaction, {
    label: "User ID",
    title: "Please provide a user to target.",
  });
  if (!/\d+/.test(input))
    return newInteraction.reply({
      content: "Invalid user id.",
      ephemeral: true,
    });

  let user = await client.users.fetch(input).catch(() => {});
  if (!user)
    return newInteraction.reply({
      content: `Could not fetch user by id \`${input}\`.`,
      ephemeral: true,
    });
  if (user.bot)
    return newInteraction.reply({
      content: `You cannot target bots with this card.`,
      ephemeral: true,
    });

  card.targetUser = user;
  card.resetCooldown();
  inv.setActiveItem(card);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return newInteraction.reply({
    content: "<@755563171758211154>",
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} ${interaction.user} just used card \`${card.name}\` and targeted ${user}.`
        ),
    ],
  });
};

/**
 * Legendary
 * Treasure Chest
 * +100% reward from the task (gold/gems)
 */
const handleCard47 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = await helper.fetchInventory(interaction.user.id);

  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  inv.setActiveItem(card);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully used card \`${card.name}\``
        ),
    ],
  });
};

/**
 * Celestial
 * Balthazar
 * Reduce the cooldown of a chosen card by 3
 */
const handleCard50 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = await helper.fetchInventory(interaction.user.id);
  const balthazar = [...inv.getActiveItems(), ...inv.getItems()].find((e: any) => e.id === 50);
  if (balthazar && (balthazar.cardType as Cooldown).cooldown.current !== 0)
    return interaction.editReply({
      content: `\`${balthazar.name}\` is currently on cooldown for ${
        (balthazar.cardType as Cooldown).cooldown.current
      } more ${(balthazar.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("submit_balthazar")
      .setStyle(ButtonStyle.Primary)
      .setLabel("Submit")
  );

  return interaction.editReply({
    content: "Please Provide the code of the card whose cooldown to reduce:",
    components: [row as any],
  });
};

/**
 * Epic
 * Treasure Hoard
 * +30% reward from the task (gold/gems)
 */
const handleCard51 = async (card: Item, db: any, interaction: CommandInteraction) => {
  const inv = await helper.fetchInventory(interaction.user.id);

  const foundCard = inv.getItems().find((e) => e.id === card.id);
  if (!foundCard)
    return interaction.editReply({
      content: `You do not own the card \`${card.name}\`.`,
    });
  card = foundCard;

  inv.setActiveItem(card);
  inv.setUserId(interaction.user.id);
  helper.updateInventoryRef(inv);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `${helper.emoteApprove} ${helper.separator} Successfully used card \`${card.name}\``
        ),
    ],
  });
};

export {
  handleCard23,
  handleCard24,
  handleCard25,
  toggleCard28,
  handleCard29,
  handleCard30,
  handleCard31,
  handleCard32,
  handleCard33,
  handleCard34,
  handleCard35,
  handleCard36,
  handleCard37,
  handleCard38,
  handleCard39,
  toggleCard40,
  handleCard44,
  handleCard45,
  handleCard46,
  handleCard47,
  handleCard50,
  handleCard51,
};
