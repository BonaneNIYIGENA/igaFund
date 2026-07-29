import { FaWhatsapp, FaPhone, FaXTwitter, FaLinkedin, FaInstagram } from "react-icons/fa6";
import type { IconType } from "react-icons/lib";

export const CONTACT_EMAIL = "igafund@gmail.com";
export const CONTACT_PHONE_DISPLAY = "+250 788 251 302";
export const CONTACT_PHONE_INTL = "250788251302";
export const CONTACT_WHATSAPP_URL = `https://wa.me/${CONTACT_PHONE_INTL}`;

export const WhatsAppIcon: IconType = FaWhatsapp;
export const PhoneIcon: IconType = FaPhone;

/**
 * Real accounts don't exist yet, so each link points at "#" (stays on the
 * same page) rather than a guessed or fabricated profile URL. Swap the
 * `href` in for the real one as soon as each account is created.
 */
export const SOCIAL_LINKS: { label: string; icon: IconType; href: string }[] = [
  { label: "X", icon: FaXTwitter, href: "#" },
  { label: "LinkedIn", icon: FaLinkedin, href: "#" },
  { label: "Instagram", icon: FaInstagram, href: "#" },
];
