/*
 * The business's own contact details, address and social profiles, supplied by the owner on 31 Oct 2026. One source
 * for the footers, the Contact page, the Organization / LocalBusiness structured data (lib/seo.ts) and /llms.txt, so
 * they never disagree.
 */
export const SUPPORT = {
  email: "garvcontact30@gmail.com",
  /** As shown to people; `phoneHref` is the dialable form. */
  phone: "+91-9873510871",
  phoneHref: "tel:+919873510871",
} as const;

/** The postal address (PIN 205001 is the Mainpuri Head Office, Agra Region, Uttar Pradesh Postal Circle). */
export const ADDRESS = {
  streetAddress: "Teen Matiya Mandir, New Basti Devpura",
  addressLocality: "Mainpuri",
  addressRegion: "Uttar Pradesh",
  postalCode: "205001",
  addressCountry: "IN",
} as const;
export const ADDRESS_LINE = `${ADDRESS.streetAddress}, ${ADDRESS.addressLocality}, ${ADDRESS.addressRegion} ${ADDRESS.postalCode}, India`;

export type SocialProfile = { platform: "Instagram"; href: string };

export const SOCIAL_PROFILES: SocialProfile[] = [
  { platform: "Instagram", href: "https://www.instagram.com/masterclassbuddy" },
];
