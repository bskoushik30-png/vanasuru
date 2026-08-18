export const BRAND = {
  name: "VANASURU",
  tagline: "",
  phoneDisplay: "+91 78991 79979",
  phoneWhatsapp: "917899179979",
  emailMysore: "vanasurumys@gmail.com",
  emailMahadevapura: "vanasurumys@gmail.com",
};

export type PropertyKey = string;

export function isPropertyMatch(roomProp: string, targetProp: string): boolean {
  if (!roomProp || !targetProp) return false;
  const r = roomProp.toLowerCase().trim();
  const t = targetProp.toLowerCase().trim();
  if (r === t) return true;
  if (r.includes(t) || t.includes(r)) return true;
  if (
    (r.includes("mysore") || r.includes("silverleaf")) &&
    (t.includes("mysore") || t.includes("silverleaf"))
  )
    return true;
  if (
    (r.includes("mahadevapura") || r.includes("village")) &&
    (t.includes("mahadevapura") || t.includes("village"))
  )
    return true;
  return false;
}

export type PropertyInfo = {
  key: PropertyKey;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  tagline: string;
  intro: string;
  hero: string;
  highlights: { title: string; blurb: string }[];
  href: string;
  mapEmbedUrl?: string;
};

export const PROPERTIES: Record<PropertyKey, PropertyInfo> = {
  mysore: {
    key: "mysore",
    name: "VANASURU Silverleaf",
    location: "Mysuru, Karnataka",
    address: "Vanasuru, 227/9, CFTRI layout, Bogadi 2nd Stage, Bogadi, Mysuru, Karnataka 570022",
    phone: "+91 78991 79979",
    email: "vanasurumys@gmail.com",
    tagline: "A serene nature retreat wrapped in gardens and gentle mornings.",
    intro:
      "Set amidst calm air and lush greenery in Bogadi, Mysuru, VANASURU Silverleaf offers quiet luxury, considered suites, and unhurried hospitality.",
    hero: "/images/DSC05302.JPG.jpeg",
    highlights: [
      { title: "Nature Estate", blurb: "Heritage gardens, bird trails, and quiet courtyards." },
      {
        title: "Farm-to-Table Dining",
        blurb: "Regional recipes prepared with homegrown organic produce.",
      },
      {
        title: "Wellness Pavilion",
        blurb: "Signature spa therapies and morning yoga overlooking the lawns.",
      },
    ],
    href: "/mysore",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2753.269961454444!2d76.60362042044873!3d12.298387815407652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baf7b7ec30ea817%3A0xf60112f9c3cfbb4c!2sVanasuru!5e0!3m2!1sen!2sin!4v1785132467896!5m2!1sen!2sin",
  },
  mahadevapura: {
    key: "mahadevapura",
    name: "VANASURU Village",
    location: "Mahadevapura, Mysuru",
    address: "Mahadevapura, Mysuru, Karnataka 571438 (12.3993043, 76.7884710)",
    phone: "+91 78991 79979",
    email: "vanasurumys@gmail.com",
    tagline: "Modern luxury for business, celebrations, and the city's finer moments.",
    intro:
      "Located in Mahadevapura, Mysuru, VANASURU Village combines serene nature with secluded luxury.",
    hero: "/images/DSC_1319 (1).jpg",
    highlights: [
      {
        title: "Executive Suites",
        blurb: "Expansive layouts designed for deep rest and productive stays.",
      },
      {
        title: "Celebration Lawns",
        blurb: "Contemporary ballrooms and landscaped outdoor spaces.",
      },
      { title: "Infinity Pool", blurb: "Temperature-controlled pool overlooking nature." },
    ],
    href: "/mahadevapura",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m24!1m8!1m3!1d706.6303616637013!2d76.78922865630193!3d12.399374526194144!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x3baf750acd75b241%3A0x9bd965e0df844a91!2sSudha%20Marigowda%20Convention%20Hall%2C%20Vadiyandahalli%2C%20Karnataka%20571415!3m2!1d12.3992534!2d76.7879521!4m5!1s0x3baf750acd75b241%3A0x9bd965e0df844a91!2sSudha%20Marigowda%20Convention%20Hall%2C%20Vadiyandahalli%2C%20Karnataka%20571415!3m2!1d12.3992534!2d76.7879521!5e1!3m2!1sen!2sin!4v1786554867831!5m2!1sen!2sin",
  },
};

export type RoomInfo = {
  slug: string;
  name: string;
  description: string;
  image: string;
  capacity: string;
  bed: string;
  amenities: string[];
  price: string;
};

export const ROOMS: RoomInfo[] = [
  {
    slug: "deluxe-room",
    name: "Deluxe Room",
    description: "A serene room wrapped in warm woods and soft light, overlooking garden greenery.",
    image: "/images/DSC05333.JPG.jpeg",
    capacity: "2 Adults",
    bed: "King Bed",
    amenities: ["Garden View", "Air Conditioning", "Free Wi-Fi", "Mini Bar", "Tea & Coffee Maker"],
    price: "Rs. 6,500 / night",
  },
  {
    slug: "premium-suite",
    name: "Premium Suite",
    description:
      "Expansive suite featuring a private balcony, deep soaking bathtub, and forest views.",
    image: "/images/DSC_1319 (1).jpg",
    capacity: "2 Adults, 1 Child",
    bed: "King Bed + Sitting Area",
    amenities: [
      "Forest View",
      "Private Balcony",
      "Air Conditioning",
      "Free Wi-Fi",
      "Mini Bar",
      "Bathtub",
    ],
    price: "Rs. 9,500 / night",
  },
  {
    slug: "family-villa",
    name: "Family Villa",
    description:
      "Two-bedroom private villa with dedicated living space and secluded garden courtyard.",
    image: "/images/Gemini_Generated_Image_f81x9ef81x9ef81x.png",
    capacity: "4 Adults, 2 Children",
    bed: "2 King Beds",
    amenities: ["Private Garden", "Living Room", "Air Conditioning", "Free Wi-Fi", "Kitchenette"],
    price: "Rs. 14,500 / night",
  },
  {
    slug: "executive-room",
    name: "Executive Room",
    description:
      "Designed for business and rest, with ergonomic workspace and refined luxury amenities.",
    image: "/images/DSC05333.JPG.jpeg",
    capacity: "2 Adults",
    bed: "King Bed",
    amenities: [
      "City & Nature View",
      "Work Desk",
      "Air Conditioning",
      "Free Wi-Fi",
      "Express Laundry",
    ],
    price: "Rs. 7,500 / night",
  },
];

export const EXPERIENCES: { title: string; blurb: string; icon?: string }[] = [
  { title: "Fine Dining", blurb: "Farm-to-table menus by resident chefs." },
  { title: "Swimming Pool", blurb: "Temperature-controlled infinity pool." },
  { title: "Event Spaces", blurb: "Ballrooms, lawns, courtyards." },
  { title: "Weddings", blurb: "Signature planners for every ritual." },
  { title: "Corporate Meetings", blurb: "Boardrooms and off-sites." },
  { title: "Room Service", blurb: "24-hour in-room dining." },
  { title: "Parking", blurb: "Valet and self-park." },
  { title: "Wi-Fi", blurb: "Fibre-speed connectivity across the resort." },
  { title: "Spa & Wellness", blurb: "Signature therapies and yoga pavilions." },
  { title: "Outdoor Activities", blurb: "Nature walks, cycling, birding." },
];

export const GALLERY: { src: string; tag: string; category: string }[] = [];

export const TESTIMONIALS: { quote: string; author: string; context: string }[] = [
  {
    quote:
      "A quiet miracle. We came for a weekend and left slower, softer, and already planning to return.",
    author: "Ananya & Rohan",
    context: "ANNIVERSARY STAY, VANASURU MYSORE",
  },
  {
    quote: "The most considered hotel we've stayed in this year. Every detail felt intentional.",
    author: "Karthik R.",
    context: "BUSINESS STAY, VANASURU MAHADEVAPURA",
  },
  {
    quote: "Our wedding was breathtaking. The team held us with such grace across three days.",
    author: "Meera & Aditya",
    context: "WEDDING, VANASURU MYSORE",
  },
];

export const EVENT_TYPES: string[] = [
  "Weddings & Galas",
  "Corporate Off-sites & Summits",
  "Engagements & Anniversaries",
  "Private Parties & Dinners",
  "Function Hall Reservations",
  "Cultural & Musical Evenings",
];

export const FUNCTION_HALLS: Array<{
  id: string;
  name: string;
  property: string;
  capacity: string;
  description: string;
  image: string;
  features: string[];
}> = [];

export const NAV_LINKS: { label: string; to: string }[] = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Rooms", to: "/rooms" },
  { label: "Experiences", to: "/experiences" },
  { label: "Gallery", to: "/gallery" },
  { label: "Events", to: "/events" },
  { label: "Contact", to: "/contact" },
];

