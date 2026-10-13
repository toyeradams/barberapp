export const SEED_HAIRSTYLES = [
  {
    name: "Signature Skin Fade",
    description:
      "Our legendary precision fade — zero-blend sides sculpted with razor detail, styled finish with hot towel. Includes consultation.",
    priceCents: 3500,
    durationMinutes: 45,
    category: "Fade",
    imageUrl:
      "https://images.pexels.com/photos/4625626/pexels-photo-4625626.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    sortOrder: 1,
  },
  {
    name: "Classic Scissor Cut",
    description:
      "Timeless scissor work — natural texture, tailored shape, wash and style. Perfect for professional & classic looks.",
    priceCents: 3000,
    durationMinutes: 30,
    category: "Haircut",
    imageUrl:
      "https://images.pexels.com/photos/34702982/pexels-photo-34702982.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    sortOrder: 2,
  },
  {
    name: "Beard Sculpt + Line-Up",
    description:
      "Razor-sharp line-up, beard shaping, hot-lather shave on the neck, beard oil finish. Walk out camera-ready.",
    priceCents: 2500,
    durationMinutes: 30,
    category: "Beard",
    imageUrl:
      "https://images.pexels.com/photos/15932225/pexels-photo-15932225.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    sortOrder: 3,
  },
  {
    name: "The Full Works",
    description:
      "Cut + skin fade + beard sculpt + hot towel shave + charcoal mask + shoulder massage. 75 minutes of pure ritual.",
    priceCents: 6500,
    durationMinutes: 75,
    category: "Package",
    imageUrl:
      "https://images.pexels.com/photos/12464841/pexels-photo-12464841.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    sortOrder: 4,
  },
  {
    name: "Kids Cut (Under 12)",
    description:
      "Patient, friendly cut for young gentlemen. Fun, fast and fuss-free with a lollipop finish.",
    priceCents: 2200,
    durationMinutes: 30,
    category: "Kids",
    imageUrl:
      "https://images.pexels.com/photos/18503604/pexels-photo-18503604.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    sortOrder: 5,
  },
  {
    name: "Hot Towel Shave",
    description:
      "Old-school straight-razor shave with triple hot towels, pre-shave oil and cooling balm. Zero irritation.",
    priceCents: 2800,
    durationMinutes: 30,
    category: "Shave",
    imageUrl:
      "https://images.pexels.com/photos/10024235/pexels-photo-10024235.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    sortOrder: 6,
  },
];

export const SEED_BARBERS = [
  {
    name: "Marcus 'The Blade' Cole",
    title: "Founder · Master Barber",
    bio: "14 years behind the chair. Specialises in skin fades, beard architecture and straight-razor finishes. Book early — he fills fast.",
    avatarUrl:
      "https://images.pexels.com/photos/5337778/pexels-photo-5337778.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    specialties: "Skin Fade, Beard Sculpt, Hot Shave",
    rating: "4.98",
  },
  {
    name: "Diego Ramirez",
    title: "Senior Barber",
    bio: "Precision scissor cuts, classic tapers and textured crops. Known for his calm chair and killer attention to detail.",
    avatarUrl:
      "https://images.pexels.com/photos/29849069/pexels-photo-29849069.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    specialties: "Classic Cut, Taper, Texture Crop",
    rating: "4.94",
  },
  {
    name: "Jay Okafor",
    title: "Barber · Fade Specialist",
    bio: "Young gun with an old soul. Drop fades, burst fades, designs and kids cuts. Energy for days.",
    avatarUrl:
      "https://images.pexels.com/photos/19189104/pexels-photo-19189104.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    specialties: "Drop Fade, Designs, Kids Cut",
    rating: "4.91",
  },
];

// Mon–Fri 09:00–19:00, Sat 09:00–17:00, Sun closed
export const SEED_RULES = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 2, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 3, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 4, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 5, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 6, startTime: "09:00", endTime: "17:00" },
];
