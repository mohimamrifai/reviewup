export type ChannelType = "whatsapp" | "telegram";

export type Channel = {
  id: number;
  type: ChannelType;
  label: string;
  url: string;
};

export const dummyChannels: Channel[] = [
  {
    id: 1,
    type: "whatsapp",
    label: "Layanan WhatsApp 24 Jam",
    url: "https://wa.me/6281234567890",
  },
  {
    id: 2,
    type: "telegram",
    label: "Layanan Telegram",
    url: "https://t.me/reviewup_cs",
  },
];
