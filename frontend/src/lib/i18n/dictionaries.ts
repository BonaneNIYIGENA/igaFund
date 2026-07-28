/**
 * Translation covers the persistent chrome (nav, header, role labels) plus
 * every page's title/description header and each dashboard's hero status
 * card — the content a person reads first on every screen. Deeper form
 * content (field labels, hints, table headers, admin-only copy) stays
 * English-only in this build; translating that fully is future work, not
 * a silent gap.
 */
export const en = {
  "nav.overview": "Overview",
  "nav.myProfile": "My profile",
  "nav.documents": "Documents",
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

  "dash.hello": "Hello, {name}",
  "dash.student.description": "Here's where your funding stands today.",
  "dash.ambassador.description": "The students you've enrolled, and what each of them needs next.",
  "dash.donor.description": "Your giving, and students who still need help.",
  "dash.admin.description": "Platform health and anything waiting on you.",

  "dash.student.step.noProfile.title": "Start your funding profile",
  "dash.student.step.noProfile.body": "Tell donors who you are, what you're studying and how much you need. You can save and come back to it.",
  "dash.student.step.rejected.title": "A reviewer asked for changes",
  "dash.student.step.rejected.bodyFallback": "Update your profile and send it back for review.",
  "dash.student.step.uploadDocs.title": "Upload your documents",
  "dash.student.step.uploadDocs.body": "A reviewer needs your transcript and ID before they can verify you. Photos from your phone are fine.",
  "dash.student.step.sendReview.title": "Send your profile for review",
  "dash.student.step.sendReview.body": "Everything looks ready. A reviewer usually responds within a few days.",
  "dash.student.step.pending.title": "Your profile is with a reviewer",
  "dash.student.step.pending.body": "Nothing to do right now — we'll notify you the moment there's a decision.",
  "dash.student.step.live.title": "You're live in the donor pool",
  "dash.student.step.live.body": "Donors can find and fund you. Share your profile link to reach more of them.",
  "dash.student.empty.title": "No profile yet",
  "dash.student.empty.description": "Your funding profile is what donors read. Create it once, and a reviewer will verify it before it goes live.",

  "page.studentDocuments.title": "Documents",
  "page.studentDocuments.description": "Reviewers read these to verify you. Only igaFund staff can open them — donors never see them.",
  "page.studentDocuments.noProfileDescription": "Upload the papers that prove your story.",
  "page.studentDocuments.emptyNoProfile.title": "Create your profile first",
  "page.studentDocuments.emptyNoProfile.description": "Documents attach to your funding profile, so that needs to exist before you can upload anything.",

  "page.ambassadorStudents.title": "My students",
  "page.ambassadorStudents.description": "Everyone you've enrolled. You can only see and manage your own students.",
  "page.ambassadorStudents.empty.title": "You haven't enrolled anyone yet",
  "page.ambassadorStudents.empty.description": "Find a student in your community who needs help with school fees. You can capture their details even without a connection.",

  "page.ambassadorEnroll.title": "Enroll a student",
  "page.ambassadorEnroll.description": "Capture their details here. You can do this without a connection.",

  "page.ambassadorDashboard.empty.title": "No students yet",
  "page.ambassadorDashboard.empty.description": "Enroll a student from your community. You can capture everything offline and it will upload itself when you're back on a signal.",

  "page.browseStudents.empty.title": "No verified students yet",
  "page.browseStudents.empty.description": "Profiles appear the moment an administrator approves them. Check back shortly, or start an application of your own.",
  "page.browseStudents.emptyFiltered.title": "Nothing matches that search",
  "page.browseStudents.emptyFiltered.description": "Try a different name, school or level — or clear the filters to see everyone.",

  "page.adminAudit.title": "Audit trail",
  "page.adminAudit.description": "Every administrative decision, permanently recorded.",

  "page.adminTickets.title": "Tickets",
  "page.adminTickets.description": "A numbered, timestamped record of every completed milestone platform-wide.",

  "page.adminAnalytics.title": "Analytics",
  "page.adminAnalytics.description": "Verification throughput and where funds have been routed.",

  "page.adminInstitutions.title": "Institutions",
  "page.adminInstitutions.description": "The registered schools that can receive donor funds. Nothing routes anywhere else.",

  "page.adminUsers.title": "User Management",
  "page.adminUsers.description": "View, manage roles, and enforce account suspensions (BR10 compliance).",

  "page.donorBrowse.title": "Find a student",
  "page.donorBrowse.description": "Every profile here has been verified by an igaFund administrator.",

  "page.adminQueue.title": "Review queue",
  "page.adminQueue.description": "Nothing becomes public until someone here approves it.",

  "page.donorDashboard.empty.title": "Every verified student is fully funded",
  "page.donorDashboard.empty.description": "There's nobody waiting right now. Check back soon — new profiles are verified regularly.",

  "page.forgotPassword.checkEmail.title": "Check your email",
  "page.forgotPassword.checkEmail.description": "If an account uses that address, a reset link is on its way.",
  "page.forgotPassword.title": "Reset your password",
  "page.forgotPassword.description": "Enter your email and we'll send you a link to set a new one.",

  "page.donorGiving.title": "My giving",
  "page.donorGiving.description": "Every contribution you've made, and the students you keep an eye on.",

  "page.login.title": "Welcome back",
  "page.login.description": "Sign in to pick up where you left off.",

  "page.register.title": "Create your account",
  "page.register.description": "It takes about a minute. You can finish your profile afterwards.",

  "page.resetPassword.title": "Set a new password",
  "page.resetPassword.description": "Choose something you haven't used on igaFund before.",

  "page.settings.title": "Settings",
  "page.settings.description": "Your account details, security, and notification preferences.",

  "page.myProfile.title": "My profile",
  "page.myProfile.description": "This is what donors read when they find you.",
  "page.myProfile.createTitle": "Create your profile",
  "page.myProfile.createDescription": "Tell donors who you are and what you're working towards.",
  "page.myProfile.tab.profile": "Profile",
  "page.myProfile.tab.progress": "Progress",
};

export const rw: typeof en = {
  "nav.overview": "Ibyagezweho",
  "nav.myProfile": "Umwirondoro wanjye",
  "nav.documents": "Inyandiko",
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

  "dash.hello": "Muraho, {name}",
  "dash.student.description": "Aha niho uzabona uko inkunga yawe ihagaze uyu munsi.",
  "dash.ambassador.description": "Abanyeshuri wanditse, n'ibyo buri wese akeneye ubu.",
  "dash.donor.description": "Inkunga watanze, n'abanyeshuri bakiri bakeneye ubufasha.",
  "dash.admin.description": "Imikorere ya sisitemu n'ibitegereje igikorwa cyawe.",

  "dash.student.step.noProfile.title": "Tangira umwirondoro wawe w'inkunga",
  "dash.student.step.noProfile.body": "Bwira abaterankunga uwo uri we, ibyo wiga n'amafaranga ukeneye. Ushobora kubika ugasubira aho wagarukiye.",
  "dash.student.step.rejected.title": "Umugenzuzi yasabye impinduka",
  "dash.student.step.rejected.bodyFallback": "Vugurura umwirondoro wawe hanyuma uwohereze ku bwa kabiri kugira ngo bawusuzume.",
  "dash.student.step.uploadDocs.title": "Shyiraho inyandiko zawe",
  "dash.student.step.uploadDocs.body": "Umugenzuzi akeneye impamyabumenyi n'indangamuntu yawe mbere yo kwemeza umwirondoro wawe. Amafoto afashwe na telefoni arahagije.",
  "dash.student.step.sendReview.title": "Ohereza umwirondoro wawe ngo usuzumwe",
  "dash.student.step.sendReview.body": "Ibintu byose birasa n'aho biteguye. Umugenzuzi asanzwe asubiza mu minsi mike.",
  "dash.student.step.pending.title": "Umwirondoro wawe uri kubasuzumwa",
  "dash.student.step.pending.body": "Nta kindi ugomba gukora ubu — tuzakumenyesha ako kanya umwanzuro ufatiwe.",
  "dash.student.step.live.title": "Ubu uraboneka ku baterankunga",
  "dash.student.step.live.body": "Abaterankunga barashobora kukubona no kuguha inkunga. Sangiza abandi ihuza ry'umwirondoro wawe kugira ngo ugere ku benshi.",
  "dash.student.empty.title": "Nta mwirondoro urimo",
  "dash.student.empty.description": "Umwirondoro wawe w'inkunga ni wo abaterankunga basoma. Uwukore rimwe, umugenzuzi azawemeza mbere y'uko ugaragara ku baterankunga.",

  "page.studentDocuments.title": "Inyandiko",
  "page.studentDocuments.description": "Abagenzuzi basoma izi nyandiko kugira ngo bakwemeze. Abakozi ba igaFund gusa ni bo bashobora kuzifungura — abaterankunga ntibazibona.",
  "page.studentDocuments.noProfileDescription": "Shyiraho inyandiko zigaragaza inkuru yawe.",
  "page.studentDocuments.emptyNoProfile.title": "Banza ukore umwirondoro wawe",
  "page.studentDocuments.emptyNoProfile.description": "Inyandiko zifatanywa n'umwirondoro wawe w'inkunga, bityo ugomba kuba wawukoze mbere yo gushyiraho inyandiko iyo ari yo yose.",

  "page.ambassadorStudents.title": "Abanyeshuri banjye",
  "page.ambassadorStudents.description": "Abo wese wanditse. Ubona kandi ucunga abanyeshuri bawe gusa.",
  "page.ambassadorStudents.empty.title": "Nturi wandika umuntu n'umwe",
  "page.ambassadorStudents.empty.description": "Shakisha umunyeshuri wo mu muryango wawe ukeneye ubufasha bw'amafaranga y'ishuri. Ushobora kwandika amakuru ye n'udafite interineti.",

  "page.ambassadorEnroll.title": "Andikisha umunyeshuri",
  "page.ambassadorEnroll.description": "Andika amakuru ye hano. Ushobora kubikora n'udafite interineti.",

  "page.ambassadorDashboard.empty.title": "Nta munyeshuri urimo",
  "page.ambassadorDashboard.empty.description": "Andikisha umunyeshuri wo mu muryango wawe. Ushobora kwandika ibintu byose udafite interineti, hanyuma bikazishyirwaho ubwabyo igihe uzagaruka ku murandasi.",

  "page.browseStudents.empty.title": "Nta munyeshuri wemejwe uraboneka",
  "page.browseStudents.empty.description": "Imyirondoro igaragara ako kanya umuyobozi ayemeje. Garuka vuba, cyangwa utangire ubusabe bwawe.",
  "page.browseStudents.emptyFiltered.title": "Nta kintu kihuye n'ushaka",
  "page.browseStudents.emptyFiltered.description": "Gerageza izina, ishuri cyangwa urwego rutandukanye — cyangwa siba muyunguruzi kugira ngo ubone bose.",

  "page.adminAudit.title": "Ibikorwa byanditswe",
  "page.adminAudit.description": "Buri cyemezo cy'umuyobozi, cyanditswe burundu.",

  "page.adminTickets.title": "Impapuro z'icyemezo",
  "page.adminTickets.description": "Inyandiko ifite umubare n'igihe, ya buri ntambwe yarangiye kuri sisitemu yose.",

  "page.adminAnalytics.title": "Isesengura",
  "page.adminAnalytics.description": "Uko igenzura rigenda n'aho amafaranga yoherejwe.",

  "page.adminInstitutions.title": "Amashuri",
  "page.adminInstitutions.description": "Amashuri yanditswe ashobora kwakira amafaranga y'abaterankunga. Nta handi ayo mafaranga ajya.",

  "page.adminUsers.title": "Gucunga abakoresha",
  "page.adminUsers.description": "Reba, hindura uruhare, kandi uhagarike konti (bikurikije BR10).",

  "page.donorBrowse.title": "Shaka umunyeshuri",
  "page.donorBrowse.description": "Buri mwirondoro uhari wemejwe n'umuyobozi wa igaFund.",

  "page.adminQueue.title": "Dosiye zitegereje",
  "page.adminQueue.description": "Nta kintu kigaragara ku bandi kugeza umuntu hano abyemeje.",

  "page.donorDashboard.empty.title": "Buri munyeshuri wemejwe yamaze kubona inkunga yose",
  "page.donorDashboard.empty.description": "Nta muntu ukiri gutegereza ubu. Garuka vuba — imyirondoro mishya iemezwa buri gihe.",

  "page.forgotPassword.checkEmail.title": "Reba imeri yawe",
  "page.forgotPassword.checkEmail.description": "Niba konti ikoresha iyo aderesi, ihuza ryo guhindura ijambo ry'ibanga riri munzira.",
  "page.forgotPassword.title": "Hindura ijambo ry'ibanga",
  "page.forgotPassword.description": "Andika imeri yawe tuguhe ihuza ryo gushyiraho irindi jambo ry'ibanga.",

  "page.donorGiving.title": "Inkunga zanjye",
  "page.donorGiving.description": "Buri nkunga watanze, n'abanyeshuri ukurikirana.",

  "page.login.title": "Murakaza neza",
  "page.login.description": "Injira ukomeze aho wagarukiye.",

  "page.register.title": "Fungura konti yawe",
  "page.register.description": "Bifata nk'umunota umwe. Ushobora kurangiza umwirondoro wawe nyuma.",

  "page.resetPassword.title": "Shyiraho ijambo ry'ibanga rishya",
  "page.resetPassword.description": "Hitamo ijambo ry'ibanga utigeze ukoresha kuri igaFund.",

  "page.settings.title": "Igenamiterere",
  "page.settings.description": "Amakuru ya konti yawe, umutekano, n'uburyo bwo kumenyeshwa.",

  "page.myProfile.title": "Umwirondoro wanjye",
  "page.myProfile.description": "Ibi ni byo abaterankunga basoma iyo bakubonye.",
  "page.myProfile.createTitle": "Kora umwirondoro wawe",
  "page.myProfile.createDescription": "Bwira abaterankunga uwo uri we n'icyo urimo gukorera.",
  "page.myProfile.tab.profile": "Umwirondoro",
  "page.myProfile.tab.progress": "Aho bigeze",
};

export type TranslationKey = keyof typeof en;
export const DICTIONARIES = { en, rw };
export type Locale = keyof typeof DICTIONARIES;
