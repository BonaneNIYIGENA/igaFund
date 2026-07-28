/**
 * Translation coverage is intentionally scoped to the persistent chrome —
 * navigation, header actions, and role labels a person sees on every screen
 * regardless of which page they're on. Page-specific prose (bios, help
 * copy, form hints) stays English-only in this build; translating that
 * fully is future work, not a silent gap.
 */
export const en = {
  "nav.overview": "Overview",
  "nav.myProfile": "My profile",
  "nav.documents": "Documents",
  "nav.progress": "Progress",
  "nav.settings": "Settings",
  "nav.myStudents": "My students",
  "nav.enroll": "Enroll",
  "nav.findStudents": "Find students",
  "nav.myGiving": "My giving",
  "nav.reviewQueue": "Review queue",
  "nav.userAccounts": "User accounts",
  "nav.analytics": "Analytics",
  "nav.institutions": "Institutions",
  "nav.tickets": "Tickets",
  "nav.auditTrail": "Audit trail",

  "role.student": "Student",
  "role.ambassador": "Community ambassador",
  "role.donor": "Donor",
  "role.admin": "Administrator",

  "header.skipToContent": "Skip to main content",
  "header.notifications": "Notifications",
  "header.accountMenu": "Account menu",
  "header.accountSettings": "Account settings",
  "header.helpCentre": "Help centre",
  "header.signOut": "Sign out",
  "header.theme": "Switch to {mode} mode",
  "header.language": "Change language",
  "header.online": "Online",
  "header.offline": "Offline — changes will sync when you reconnect",

  "landing.mission": "Mission",
  "landing.howItWorks": "How it works",
  "landing.students": "Students",
  "landing.help": "Help",
  "landing.signIn": "Sign in",
  "landing.getStarted": "Get started",
};

export const rw: typeof en = {
  "nav.overview": "Ibyagezweho",
  "nav.myProfile": "Umwirondoro wanjye",
  "nav.documents": "Inyandiko",
  "nav.progress": "Aho bigeze",
  "nav.settings": "Igenamiterere",
  "nav.myStudents": "Abanyeshuri banjye",
  "nav.enroll": "Kwandikisha",
  "nav.findStudents": "Shakisha abanyeshuri",
  "nav.myGiving": "Inkunga zanjye",
  "nav.reviewQueue": "Gusuzuma dosiye",
  "nav.userAccounts": "Abakoresha",
  "nav.analytics": "Isesengura",
  "nav.institutions": "Amashuri",
  "nav.tickets": "Impapuro z'icyemezo",
  "nav.auditTrail": "Ibikorwa byanditswe",

  "role.student": "Umunyeshuri",
  "role.ambassador": "Intumwa y'umuryango",
  "role.donor": "Umuterankunga",
  "role.admin": "Umuyobozi",

  "header.skipToContent": "Simbuka uje ku bikubiyemo",
  "header.notifications": "Ubutumwa",
  "header.accountMenu": "Ibya konti",
  "header.accountSettings": "Igenamiterere rya konti",
  "header.helpCentre": "Ubufasha",
  "header.signOut": "Gufunga konti",
  "header.theme": "Hindura kuri {mode}",
  "header.language": "Hindura ururimi",
  "header.online": "Ufite interineti",
  "header.offline": "Nta interineti — impinduka zizohuzwa iyo igarutse",

  "landing.mission": "Intego",
  "landing.howItWorks": "Uko bikora",
  "landing.students": "Abanyeshuri",
  "landing.help": "Ubufasha",
  "landing.signIn": "Injira",
  "landing.getStarted": "Tangira",
};

export type TranslationKey = keyof typeof en;
export const DICTIONARIES = { en, rw };
export type Locale = keyof typeof DICTIONARIES;
