import Inventory from "../Classes/Inventory";
import Pack from "../Classes/Pack";
import { Cooldown, ItemType } from "../types";
import Item from "../Classes/Item";
import * as ch from "../Classes/CardHandler";
import {
  ActionRowBuilder,
  Client,
  CommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import fs from "node:fs";

const isCooldown = (obj: any = {}): obj is Cooldown => {
  return "cooldown" in obj;
};

const wrapInColor = (color: string, str: string) => {
  const resetColor = "\x1b[0m";

  let clr;
  switch (color) {
    case "blue":
      clr = "\x1b[94m";
      break;
    case "green":
      clr = "\x1b[32m";
      break;
    default:
      clr = "\x1b[0m";
      break;
  }
  return `${clr}${str}${resetColor}`;
};

const randomPick = (array: Array<any>): any => array[Math.floor(Math.random() * array.length)];

// TODO

const handleToggleCard = (card: Item, db: any, interaction: CommandInteraction) => {
  if (!(card instanceof Item)) throw Error("Invalid Argument: Must be an instance of Item.");

  let returnValue;
  let cardId = card.id;
  switch (cardId) {
    case 28:
      returnValue = ch.toggleCard28(card, db, interaction);
      break;
    case 40:
      returnValue = ch.toggleCard40(card, db, interaction);
      break;
  }
};

const handleCustomCardUsage = (
  card: Item,
  db: any,
  interaction: CommandInteraction,
  client: Client
) => {
  if (!(card instanceof Item)) throw Error("Invalid Argument: Must be an instance of Item.");

  let cardId = card.id;
  let returnValue;
  switch (cardId) {
    case 23:
      returnValue = ch.handleCard23(card, db, interaction);
      break;
    case 25:
      returnValue = ch.handleCard25(card, db, interaction);
      break;
    case 29:
      returnValue = ch.handleCard29(card, db, interaction);
      break;
    case 31:
      returnValue = ch.handleCard31(card, db, interaction);
      break;
    case 32:
      returnValue = ch.handleCard32(card, db, interaction);
      break;
    case 33:
      returnValue = ch.handleCard33(card, db, interaction);
      break;
    case 34:
      returnValue = ch.handleCard34(card, db, interaction);
      break;
    case 35:
      returnValue = ch.handleCard35(card, db, interaction);
      break;
    case 37:
      returnValue = ch.handleCard37(card, db, interaction);
      break;
    case 39:
      returnValue = ch.handleCard39(card, db, interaction);
      break;
    // case 43:
    //   returnValue = ch.handleCard43(card, db, interaction, client);
    //   break;
    case 44:
      returnValue = ch.handleCard44(card, db, interaction);
      break;
    case 46:
      ch.handleCard46(card, db, interaction, client);
      break;
    // case 49:
    //   returnValue = ch.handleCard49(card, db, interaction);
    //   break;
    case 50:
      returnValue = ch.handleCard50(card, db, interaction);
      break;
    default:
      break;
  }

  return returnValue;
};

const handlePostTaskCard = (card: Item, db: any, interaction: CommandInteraction) => {
  if (!(card instanceof Item)) throw Error("Invalid Argument: Must be an instance of Item.");

  let cardId = card.id;
  switch (cardId) {
    case 24:
      ch.handleCard24(card, db, interaction);
      break;
    case 36:
      ch.handleCard36(card, db, interaction);
      break;
    case 47:
      ch.handleCard47(card, db, interaction);
      break;
    default:
      break;
  }
};

const getInventoryAsObject = (userId: string) => {
  const currentInventories = JSON.parse(fs.readFileSync("./data/inventories.json", "utf-8"));

  let userObject = currentInventories.find((e: any) => e.userId === userId);
  return userObject ? new Inventory().fromJSON(userObject.inventory) : new Inventory();
};

const updateInventoryRef = (inv: Inventory, user: any) => {
  const currentInventories = JSON.parse(fs.readFileSync("./data/inventories.json", "utf-8"));

  let index = currentInventories.findIndex((e: any) => e.userId === user.id);
  if (index < 0) {
    currentInventories.push({
      userId: user.id,
      userName: user.username,
      inventory: inv,
    });
  } else {
    currentInventories[index].inventory = inv;
  }
  fs.writeFileSync("./data/inventories.json", JSON.stringify(currentInventories, null, "\t"));
};

const updateTotalPacksOpened = (user: any, db: any, amount: number = 1) => {
  const exp = 20;

  const currentStats = db.prepare(`SELECT * FROM BazaarStats WHERE id=?`).get(user.id);

  if (currentStats) {
    const stats = JSON.parse(currentStats.stats);
    let newTotal = parseInt(stats.packs_opened ?? 0) + amount;
    stats.packs_opened = newTotal;

    db.prepare(`UPDATE BazaarStats SET stats=? WHERE id=?`).run(JSON.stringify(stats), user.id);
  } else {
    db.prepare(`INSERT INTO BazaarStats VALUES(?,?,?,?,?)`).run(
      user.id,
      JSON.stringify({ packs_opened: amount }),
      exp * amount,
      0,
      JSON.stringify({ global: null, personal: null })
    );
  }
};

const updateTotalEXP = (
  interaction: CommandInteraction,
  db: any,
  amount: number,
  value: number = 100
) => {
  const currentEXP = db.prepare(`SELECT * FROM BazaarStats WHERE id=?`).get(interaction.user.id);

  if (currentEXP) {
    let formerLevel = getLevelData(currentEXP.exp).level;
    let levelNow = getLevelData(currentEXP.exp + value).level;

    if (levelNow > formerLevel) {
      addScrap(interaction.user, db, levelNow);
      interaction.channel?.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `${emoteLevels} ${separator} ${interaction.user} just leveled up and gained ${levelNow} scrap ${emoteScrap}! They are now level ${levelNow}.`
            ),
        ],
      });
    }

    let newTotal = parseInt(currentEXP.exp) + amount * value;
    db.prepare(`UPDATE BazaarStats SET exp=? WHERE id=?`).run(newTotal, interaction.user.id);
  } else {
    if (getLevelData(value).level >= 1)
      interaction.channel?.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Level Up")
            .setColor("Green")
            .setDescription(
              `${emoteApprove} ${separator} ${
                interaction.user
              } just leveled up! They are now level ${getLevelData(value).level}`
            ),
        ],
      });

    db.prepare(`INSERT INTO BazaarStats VALUES(?,?,?,?,?)`).run(
      interaction.user.id,
      JSON.stringify({}),
      amount * value,
      0,
      JSON.stringify({ global: null, personal: null })
    );
  }
};

const addScrap = (user: any, db: any, amount: number) => {
  const currentScrap = db.prepare(`SELECT * FROM points WHERE id=?`).get(user.id);

  if (currentScrap) {
    let newTotal = parseInt(currentScrap.scrap) + amount;
    db.prepare(`UPDATE points SET scrap=? WHERE id=?`).run(newTotal, user.id);
  } else {
    db.prepare(`INSERT INTO points VALUES(?,?,?,?,?,?)`).run(
      user.id,
      user.username,
      0,
      0,
      0,
      amount
    );
  }
};

const getLevelData = (exp: number) => {
  let level = 0;
  while (exp >= (level + 1) * 50) {
    exp -= (level + 1) * 50;
    level++;
  }

  return { level, excess: exp };
};

const getProgressBar = (val: number, total: number = 100) => {
  let z = (val / total) * 100;

  let progressBar = "";
  for (let i = 0; i < 100; i += 10) {
    if (z - 10 >= 0) {
      progressBar += "▰";
      z -= 10;
    } else {
      progressBar += "▱";
    }
  }

  return progressBar;
};

/**
 * Hp calculations - Each card owned
 * Common: +5 hp
 * Rare: +15 hp
 * Legendary: +50 hp
 * Celestial: +250 hp
 * Player level: level×5 hp
 */
const bz_getHealth = (inv: Inventory, level: number) => {
  let allItems = [...inv.getActiveItems(), ...inv.getItems()];
  let uniqueItems = {
    common: allItems.filter((e) => e.rarity === "Common"),
    rare: allItems.filter((e) => e.rarity === "Rare"),
    legendary: allItems.filter((e) => e.rarity === "Legendary"),
    celestial: allItems.filter((e) => e.rarity === "Celestial"),
  };

  let totals = {
    common: uniqueItems.common.length * 5,
    rare: uniqueItems.rare.length * 15,
    legendary: uniqueItems.legendary.length * 50,
    celestial: uniqueItems.celestial.length * 250,
  };

  return totals.common + totals.rare + totals.legendary + totals.celestial + level * 2;
};

/**
 * Dmg Calculations - Each unique card owned
 * Common: +10 dmg
 * Rare: +15 dmg
 * Legendary: +25 dmg
 * Celestial: +50 dmg
 * Player level: level×2 dmg
 */
const bz_getDamage = (inv: Inventory, level: number) => {
  let allItems = [...inv.getActiveItems(), ...inv.getItems()];
  let uniqueItems = {
    common: allItems.filter((e) => e.rarity === "Common"),
    rare: allItems.filter((e) => e.rarity === "Rare"),
    legendary: allItems.filter((e) => e.rarity === "Legendary"),
    celestial: allItems.filter((e) => e.rarity === "Celestial"),
  };

  let totals = {
    common: uniqueItems.common.length * 10,
    rare: uniqueItems.rare.length * 15,
    legendary: uniqueItems.legendary.length * 25,
    celestial: uniqueItems.celestial.length * 50,
  };

  const totalDamage = Object.values(totals).reduce((acc, val) => acc + val, 0) + level * 2;
  const rng = Math.random() * 2 - 1;
  const tenPercent = totalDamage * 0.1;

  return Math.round(totalDamage + tenPercent * rng);
};

const userUsedPostCard = (user: any, db: any) => {
  let currentTask = db.prepare(`SELECT * FROM Bazaar WHERE active='true'`).all();
  if (currentTask.length < 1) return false;
  else currentTask = currentTask[0];

  let userList = JSON.parse(currentTask.participants);
  return userList.find((e: any) => e.id === user.id) !== undefined;
};

const updatePostCardUsed = (card: Item, db: any, user: any) => {
  let currentTask = db.prepare(`SELECT * FROM Bazaar WHERE active='true'`).all();
  if (currentTask.length < 1) return;
  else currentTask = currentTask[0];

  let userList = JSON.parse(currentTask.participants);
  if (userList.find((e: any) => e.id === user.id)) return;

  const newUserObject = {
    id: user.id,
    card: card.id,
  };
  userList.push(newUserObject);

  db.prepare(`UPDATE Bazaar SET participants=? WHERE id=?`).run(
    JSON.stringify(userList),
    currentTask.id
  );
};

const updatePVPStats = (user: any, db: any, result: number) => {
  const currentStats = db.prepare(`SELECT * FROM BazaarStats WHERE id=?`).get(user.id);

  if (currentStats) {
    let stats = JSON.parse(currentStats.stats); // fill the obect with the default values in case user has not participated in pvp yet
    if (stats === 0) stats = {};
    if (!stats.pvp_stats) stats.pvp_stats = { wins: 0, losses: 0 };
    if (!stats.pvp_stats.wins) stats.pvp_stats.wins = 0;
    if (!stats.pvp_stats.losses) stats.pvp_stats.losses = 0;

    if (result > 0) stats.pvp_stats.wins = stats.pvp_stats.wins + result;
    else stats.pvp_stats.losses = stats.pvp_stats.losses + Math.abs(result);

    db.prepare(`UPDATE BazaarStats SET stats=? WHERE id=?`).run(JSON.stringify(stats), user.id);
  } else {
    let stats = {
      pvp_stats: {
        wins: result > 0 ? result : 0,
        losses: result < 0 ? Math.abs(result) : 0,
      },
    };
    db.prepare(`INSERT INTO BazaarStats VALUES(?,?,?,?,?)`).run(
      user.id,
      JSON.stringify(stats),
      0,
      0,
      JSON.stringify({ global: null, personal: null })
    );
  }
};

const updateTasksWon = (user: any, db: any) => {
  const currentStats = db.prepare(`SELECT * FROM BazaarStats WHERE id=?`).get(user.id);

  if (currentStats) {
    const stats = JSON.parse(currentStats.stats);
    let newTotal = parseInt(stats.tasks_won ?? 0) + 1;
    stats.tasks_won = newTotal;

    db.prepare(`UPDATE BazaarStats SET stats=? WHERE id=?`).run(JSON.stringify(stats), user.id);
  } else {
    db.prepare(`INSERT INTO BazaarStats VALUES(?,?,?,?,?)`).run(
      user.id,
      JSON.stringify({ tasks_won: 1 }),
      0,
      0,
      JSON.stringify({ global: null, personal: null })
    );
  }
};

const updateCardsLiquidated = (user: any, db: any, amount: number = 1) => {
  const currentStats = db.prepare(`SELECT * FROM BazaarStats WHERE id=?`).get(user.id);

  if (currentStats) {
    const stats = JSON.parse(currentStats.stats);
    let newTotal = parseInt(stats.cards_liquidated ?? 0) + amount;
    stats.cards_liquidated = newTotal;

    db.prepare(`UPDATE BazaarStats SET stats=? WHERE id=?`).run(JSON.stringify(stats), user.id);
  } else {
    db.prepare(`INSERT INTO BazaarStats VALUES(?,?,?,?,?)`).run(
      user.id,
      JSON.stringify({ cards_liquidated: amount }),
      0,
      0,
      JSON.stringify({ global: null, personal: null })
    );
  }
};

const getModalInput = (
  client: Client,
  interaction: CommandInteraction,
  options: { label: string; title: string }
): Promise<{ input: string; interaction: CommandInteraction }> => {
  return new Promise((resolve, reject) => {
    const defaultField = new TextInputBuilder()
      .setCustomId("default_input_field")
      .setLabel(options.label ?? "User Input")
      .setStyle(TextInputStyle.Short);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(defaultField);

    const modal = new ModalBuilder()
      .setCustomId("default_input_modal")
      .setTitle(options.title ?? "Please submit your input")
      .addComponents(actionRow);

    interaction.showModal(modal);

    const listener = async (modalInteraction: any) => {
      if (!modalInteraction.isModalSubmit()) return;
      if (modalInteraction.customId !== "default_input_modal") return;

      const input = modalInteraction.fields.getTextInputValue("default_input_field");

      client.off("interactionCreate", listener);

      // Resolve the promise with the input value
      resolve({ input, interaction: modalInteraction });
    };

    client.on("interactionCreate", listener);
    setTimeout(() => {
      try {
        client.off("interactionCreate", listener);
      } catch {}
      reject(new Error("Modal input timed out"));
    }, 60_000);
  });
};

const updateItemProperties = (inventories: Array<any>, item: ItemType, { global = true }) => {
  if (!global) return;

  for (const entry of inventories) {
    let inv = new Inventory().fromJSON(entry.inventory);

    let activeIndex = inv.getActiveItems().findIndex((e) => e.id === item.id);
    if (activeIndex >= 0) {
      const newItem = new Item(item);
      const oldItem = JSON.parse(JSON.stringify(inv.activeItems[activeIndex]));
      inv.activeItems[activeIndex] = newItem;

      inv.activeItems[activeIndex].amount = oldItem.amount;
      if (isCooldown(newItem.cardType)) {
        newItem.cardType.cooldown.current =
          oldItem.cardType.cooldown?.current ?? newItem.cardType.cooldown.current;
      }

      if (
        inv.activeItems[activeIndex].cardType !== oldItem.cardType &&
        inv.activeItems[activeIndex].cardType !== "passive"
      ) {
        inv.moveToInventory(inv.activeItems[activeIndex]);

        if (isCooldown(newItem.cardType)) newItem.cardType.cooldown.current = 0;
      }

      updateInventoryRef(inv, { id: entry.userId, username: entry.userName });
    }

    let generalIndex = inv.getItems().findIndex((e) => e.id === item.id);
    if (generalIndex >= 0) {
      const newItem = new Item(item);
      const oldItem = JSON.parse(JSON.stringify(inv.list[generalIndex]));
      inv.list[generalIndex] = newItem;

      inv.list[generalIndex].amount = oldItem.amount;
      if (isCooldown(newItem.cardType)) {
        newItem.cardType.cooldown.current =
          oldItem.cardType.cooldown?.current ?? newItem.cardType.cooldown.current;
      }

      if (inv.list[generalIndex].cardType === "passive") inv.setActiveItem(inv.list[generalIndex]);

      updateInventoryRef(inv, { id: entry.userId, username: entry.userName });
    }
  }
};

const updatePackProperties = (inventories: Array<any>, pack: Pack, { global = true }) => {
  if (!global) return;

  for (const entry of inventories) {
    let inv = new Inventory().fromJSON(entry.inventory);

    let index = inv.getPacks().findIndex((e) => e.code === pack.code);
    if (index >= 0) {
      const newPack = JSON.parse(JSON.stringify(pack));
      const oldPack = JSON.parse(JSON.stringify(inv.packs[index]));
      inv.packs[index] = newPack;

      inv.packs[index].amount = oldPack.amount;

      updateInventoryRef(inv, { id: entry.userId, username: entry.userName });
    }
  }
};

// TODO

const emoteApprove = "<:BB_Check:1031690264089202698>";
const emoteDeny = "<:BB_Cross:1031690265334911086>";
const emoteBlank = "<:blank:1019977634249187368>";
const separator = "┊";
const emoteBazaar = "<:bsoc:1142949974506750052>";
const emoteBazaar_Energy = "<:bene:1142949340164391073>";
const emoteBazaar_Pack = "<:bpack:1142934055822819438>";
const emoteBazaar_PVP = "<:bpvp:1142935775680409833>";
const emoteBazaar_Use = "<:buse:1142933093968261322>";
const emoteBazaar_Cards = "<:bcards:1142941345498017792>";
const emoteBazaar_Win = "<:bwin:1142939355921522708>";
const emoteBazaar_Liquid = "<:bss:1143263099219087360>";

const emoteCommon = "<:bcom:1143457091856633907>";
const emoteRare = "<:brare:1143456990006358066>";
const emoteLegendary = "<:bleg:1143456863841693767>";
const emoteCelestial = "<:bcel:1143456627480076368>";

const emoteGems = "<:bgem:1109529198227361872>";
const emoteGold = "<:bgold:1109527028434219088>";
const emoteScrap = "<:bscrap:1109528259168837704>";

const emoteLevels = "<:BB_Levels:1027227604144640030>";
const emoteSteps = "<:BB_Steps:1027227609723047966>";
const emoteNPC = "<:BB_NPC:1027227605650391102>";
const emotePVP = "<:BB_PVP:1027227607034515456>";
const emoteQuests = "<:BB_Quests:1027227608267636816>";
const emoteTasks = "<:BB_Tasks:1027227610993938472>";
const emoteBoss = "<:BB_Boss:1027227600784982077>";
const emoteBounties = "<:BB_Bounties:1027227602320097361>";
const emoteHeart = "<:BB_Heart:1141096928747208795>";

export {
  wrapInColor,
  randomPick,
  handleToggleCard,
  handleCustomCardUsage,
  handlePostTaskCard,
  getInventoryAsObject,
  updateInventoryRef,
  updateTotalPacksOpened,
  updateTotalEXP,
  addScrap,
  getLevelData,
  getProgressBar,
  bz_getHealth,
  bz_getDamage,
  userUsedPostCard,
  updatePostCardUsed,
  updatePVPStats,
  updateTasksWon,
  updateCardsLiquidated,
  getModalInput,
  updateItemProperties,
  updatePackProperties,
  separator,
  emoteApprove,
  emoteDeny,
  emoteBlank,
  emoteBazaar,
  emoteBazaar_Energy,
  emoteBazaar_Pack,
  emoteBazaar_PVP,
  emoteBazaar_Use,
  emoteBazaar_Cards,
  emoteBazaar_Win,
  emoteBazaar_Liquid,
  emoteCommon,
  emoteRare,
  emoteLegendary,
  emoteCelestial,
  emoteGems,
  emoteGold,
  emoteScrap,
  emoteLevels,
  emoteSteps,
  emoteNPC,
  emotePVP,
  emoteQuests,
  emoteTasks,
  emoteBoss,
  emoteBounties,
  emoteHeart,
};
