import { Client, EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import * as helper from "../ext/Helper";
import { ModalInteraction } from "./IModalInteraction";
import Item from "../Classes/Item";
import Cooldown from "../types/Cooldown";

export const card_50_pick: ModalInteraction = {
  modalId: "card_50_pick",
  async execute(client: Client, interaction: ModalSubmitInteraction) {
    const cardCode = interaction.fields.getTextInputValue("picked_card");

    const droppool = await helper.fetchDroppool();
    const inv = await helper.fetchInventory(interaction.user.id);
    const balthazar = [...inv.getActiveItems(), ...inv.getItems()].find((e) => e.id === 50);
    if (!balthazar)
      return interaction.reply({
        content: `You do not own the card \`Balthazar\``,
        ephemeral: true,
      });

    if ((balthazar.cardType as Cooldown).cooldown?.current > 0)
      return interaction.reply({
        content: `Could not use card \`${
          balthazar.name
        }\` because it's currently on cooldown.\nIt is on cooldown for ${
          (balthazar.cardType as Cooldown).cooldown.current
        } more ${(balthazar.cardType as Cooldown).cooldown.current > 1 ? "turns" : "turn"}.`,
        ephemeral: true,
      });

    let card: any = [...inv.getActiveItems(), ...inv.getItems()].find((e) => e.code === cardCode);
    if (!card) {
      for (const pack of droppool) {
        const item = pack.items.find((e: Item) => e.code === cardCode);
        if (!item) continue;

        return interaction.reply({
          content: `You do not own the card \`${item.name}\` with the code \`${item.code}\`.`,
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `There is no card with the code \`${cardCode}\`.`,
        ephemeral: true,
      });
    }

    if (typeof card.cardType === "string")
      return interaction.reply({
        content: `\`${card.name}\` is not a cooldown based card.`,
        ephemeral: true,
      });

    if (typeof card.cardType !== "string" && card.cardType.cooldown.current === 0)
      return interaction.reply({
        content: `\`${card.name}\` is not on cooldown and cannot be reduced.`,
        ephemeral: true,
      });

    card = new Item(card);
    for (let i = 0; i < 3; i++) {
      card.turn();
    }

    balthazar.use();
    helper.updateInventoryRef(inv);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `${helper.emoteApprove} ${helper.separator} Successfully used card \`${
              balthazar.name
            }\`.\n${helper.emoteBlank} ${helper.separator} You reduced \`${
              card.name
            }\`'s cooldown by 3 turns.\n${helper.emoteBlank} ${
              helper.separator
            } It is on cooldown for ${card.cardType.cooldown.current} more ${
              card.cardType.cooldown.current === 1 ? "turn" : "turns"
            }.`
          ),
      ],
    });
  },
};
