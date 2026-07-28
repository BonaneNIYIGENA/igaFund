import { Instagram, Linkedin, MessageCircle, Twitter, type LucideIcon } from "lucide-react";

export const CONTACT_EMAIL = "igafund@gmail.com";
export const CONTACT_PHONE_DISPLAY = "+250 788 251 302";
export const CONTACT_PHONE_INTL = "250788251302";
export const CONTACT_WHATSAPP_URL = `https://wa.me/${CONTACT_PHONE_INTL}`;

export const SOCIAL_LINKS: { label: string; icon: LucideIcon }[] = [
  { label: "X", icon: Twitter },
  { label: "LinkedIn", icon: Linkedin },
  { label: "Instagram", icon: Instagram },
];

export const WhatsAppIcon: LucideIcon = MessageCircle;
