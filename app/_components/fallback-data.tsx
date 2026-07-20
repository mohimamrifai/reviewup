import {
  Footprints,
  Headphones,
  Shirt,
  Tv,
  Wallet,
  Watch,
  Wind,
} from "lucide-react"; 

// Hardcoded fallback: dipakai saat database tidak punya produk aktif,
// supaya tampilan tetap konsisten & tidak kosong.
const fallbackProducts = [
  {
    id: "1",
    title: "JAM TANGAN ALEXANDRE CHRISTIE AC 8161 COUPLE MURAH.",
    price: "Rp2.350.000",
    icon: Watch,
  },
  {
    id: "2",
    title:
      "SMILE&ART Junior Hoodie II SMILE&ART Sweater Hoodie II Sweater Olbring…",
    price: "Rp38.950",
    icon: Shirt,
  },
  {
    id: "3",
    title: "TZ BAJU SWEATSHIRT PRIA PR SANTAI GUNUNG DISTRO KEREN M…",
    price: "Rp38.461",
    icon: Shirt,
  },
  {
    id: "4",
    title: "TTWS M19 HEADSET",
    price: "Rp31.500",
    icon: Headphones,
  },
  {
    id: "5",
    title:
      "DWEBLIES kipas mini portable angin kipas L size Portable Digital Display…",
    price: "Rp69.000",
    icon: Wind,
  },
  {
    id: "6",
    title:
      "Dompet Wanita Aurora Bordir Premium Berkualitas Dompet Pendek Genggam",
    price: "Rp15.900",
    icon: Wallet,
  },
  {
    id: "7",
    title:
      "MXQ PRO Android TV Box 4K HD Smart Set Top Box 64GB Ram 512GB Rom…",
    price: "Rp184.900",
    icon: Tv,
  },
  {
    id: "8",
    title:
      "Sandal Pria keren Sandal slip on Pria santai Gunung Pria original 100 cowok k…",
    price: "Rp102.900",
    icon: Footprints,
  },
];

export default fallbackProducts;