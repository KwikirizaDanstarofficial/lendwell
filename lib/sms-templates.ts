/**
 * Multilingual SMS Templates
 *
 * Supports English, Luganda, and bilingual (both) messaging.
 *
 * Luganda glossary used throughout:
 *   ssente          = money
 *   obufumbi        = savings (from okufumba - to store/save)
 *   okusasula       = to pay / to settle a payment
 *   omuwendo        = amount / price
 *   obuliro         = balance / remaining amount
 *   omuze           = fine / penalty
 *   oloan           = loan (borrowed English, standard in Ugandan SACCOs)
 *   obukutu         = membership
 *   namba           = number
 *   kati            = now / currently
 *   ennaku          = days
 *   okutereka       = to save / to keep
 *   okukuŋŋaana     = to gather / meeting
 *   twebaza / webale = thank you / we are grateful
 *   nyo             = very much (intensifier)
 *   nsaba           = I request / I ask / please
 *   mangu           = quickly / soon
 *   leero           = today
 *   enkya           = tomorrow
 *   obuzibu         = problem / difficulty / trouble
 *   tufunye         = we have received
 *   ensonga         = reason / cause
 *   litemereddwa    = it has been approved
 *   lujambaatidde   = it is overdue / it has passed its date
 *   ezisigadde      = remaining (plural)
 */

export type SmsLanguage = "english" | "luganda" | "both"

// ─── English Templates ────────────────────────────────────────────────────────

const english = {
  welcome: (fullName: string, memberCode: string) =>
    `Welcome to our SACCO, ${fullName}! Your member code is ${memberCode}. Keep this code for all your transactions. Thank you for joining us!`,

  loanApproved: (fullName: string, amount: number, memberCode: string) =>
    `Dear ${fullName}, your loan application of UGX ${amount.toLocaleString()} has been approved. Member code: ${memberCode}. Thank you!`,

  loanRejected: (fullName: string, memberCode: string) =>
    `Dear ${fullName}, your loan application has been declined. Please visit us for more information. Member code: ${memberCode}.`,

  savingsDeposit: (fullName: string, amount: number, balance: number, memberCode: string) =>
    `Dear ${fullName}, we have received your savings of UGX ${amount.toLocaleString()}. New balance: UGX ${balance.toLocaleString()}. Member code: ${memberCode}. Thank you!`,

  meetingReminder: (fullName: string, date: string, time: string, venue: string) =>
    `Dear ${fullName}, reminder: General meeting on ${date} at ${time}. Venue: ${venue}. Your attendance is important!`,

  passwordReset: (fullName: string, expiresIn: number = 15) =>
    `Dear ${fullName}, you requested a password reset. This expires in ${expiresIn} minutes. If you did not request this, please ignore.`,

  fineIssued: (fullName: string, amount: string, reason: string | null) =>
    `Dear ${fullName}, a fine of ${amount} has been issued on your account.${reason ? ` Reason: ${reason}.` : ""} Please settle this promptly.`,

  loanDeclined: (fullName: string, reason: string) =>
    `Dear ${fullName}, your loan application has been declined.${reason ? ` Reason: ${reason}.` : ""} Contact us for more information.`,

  loanDisbursed: (fullName: string, amount: string, loanRef: string) =>
    `Dear ${fullName}, your loan of ${amount} has been disbursed to your account. Ref: ${loanRef}. Thank you for banking with us!`,

  loanRepayment: (fullName: string, amount: string, balance: string) =>
    `Dear ${fullName}, we have received your loan payment of ${amount}. Remaining balance: ${balance}. Thank you!`,

  loanReminder3Days: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `Dear ${fullName}, your loan (Ref: ${loanRef}) balance of ${balance} is due on ${dueDate} — 3 days from now. Please arrange payment to avoid penalties.`,

  loanReminder1Day: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `Dear ${fullName}, REMINDER: Your loan (Ref: ${loanRef}) balance of ${balance} is due TOMORROW (${dueDate}). Please pay today to avoid late fees.`,

  loanReminderToday: (fullName: string, loanRef: string, balance: string) =>
    `Dear ${fullName}, your loan (Ref: ${loanRef}) balance of ${balance} is DUE TODAY. Please pay immediately to avoid penalties.`,

  loanOverdue: (fullName: string, loanRef: string, balance: string, daysOverdue: number) =>
    `Dear ${fullName}, your loan (Ref: ${loanRef}) is OVERDUE by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}. Outstanding balance: ${balance}. Please pay immediately or contact us to avoid further action.`,
}

// ─── Luganda Templates ────────────────────────────────────────────────────────
// Grammar notes:
//  • Luganda verbs agree with noun class (oku- infinitive prefix).
//  • "okusasula" = to pay/settle; "okusasulwa" = to be paid.
//  • Subject agreement: "tu-" (we), "ba-" (they 3rd person pl).
//  • Possessives: "bwammwe" (your savings), "lwo" (your loan - class lu-).
//  • Tense: "-a-" past, "-ja-" future.
//  • "Nsaba" = "I request / please" — polite imperative.

const luganda = {
  welcome: (fullName: string, memberCode: string) =>
    `Tukusanyukidde nnyo mu SACCO yaffe, ${fullName}! Namba yo y'obukutu ye ${memberCode}. Tereka namba eno bulungi eri okukozesa mu bikolwa byonna. Webale nyo okutwegatta!`,
  // "We are very pleased to have you in our SACCO, [name]! Your membership number is [code]. Keep this number well for use in all transactions. Thank you very much for joining us!"

  loanApproved: (fullName: string, amount: number, memberCode: string) =>
    `${fullName}, essuubi lyo ly'oloan erya UGX ${amount.toLocaleString()} litemereddwa! Namba y'obukutu: ${memberCode}. Webale okusigalira nafe — Twebaza nnyo!`,
  // "[name], your loan application of UGX [amount] has been approved! Member code: [code]. Thank you for staying with us — We are very grateful!"

  loanRejected: (fullName: string, memberCode: string) =>
    `${fullName}, essuubi lyo ly'oloan sirinaaganiririzibwa. Nsaba ozze ku bifo byaffe okulabagana okutegeera ensonga. Namba y'obukutu: ${memberCode}.`,
  // "[name], your loan application was not approved. Please come to our offices to understand the reason. Member code: [code]."

  savingsDeposit: (fullName: string, amount: number, balance: number, memberCode: string) =>
    `${fullName}, tufunye obufumbi bwammwe obwa UGX ${amount.toLocaleString()}. Obufumbi bwammwe bwonna kati buli UGX ${balance.toLocaleString()}. Namba y'obukutu: ${memberCode}. Webale okutereka!`,
  // "[name], we have received your savings of UGX [amount]. Your total savings are now UGX [balance]. Member code: [code]. Thank you for saving!"

  meetingReminder: (fullName: string, date: string, time: string, venue: string) =>
    `${fullName}, ekibuuzo: Okukuŋŋaana kw'amazima ku ${date} nga ssaawa ${time}. Ekifo: ${venue}. Okujja kwammwe kwa waggulu nnyo — Nsaba ojje!`,
  // "[name], a reminder: The important meeting is on [date] at [time]. Venue: [venue]. Your attendance is very important — Please come!"

  passwordReset: (fullName: string, expiresIn: number = 15) =>
    `${fullName}, wasaba okukyusa password yo. Okulambula kuno kujja okuggwa mu edakiika ${expiresIn}. Bw'oteleka kasaba kino, sikireba.`,
  // "[name], you requested to change your password. This link will expire in [n] minutes. If you did not request this, please ignore it."

  fineIssued: (fullName: string, amount: string, reason: string | null) =>
    `${fullName}, omuze gwa ${amount} guteeredwa ku account yo.${reason ? ` Ensonga: ${reason}.` : ""} Nsaba osasule mangu okuggibwa obuzibu obutono.`,
  // "[name], a fine of [amount] has been placed on your account.[Reason: ...] Please pay quickly to avoid a bigger problem."

  loanDeclined: (fullName: string, reason: string) =>
    `${fullName}, essuubi lyo ly'oloan silinaaganiririzibwa.${reason ? ` Ensonga: ${reason}.` : ""} Nsaba ozze ku bifo byaffe okulabagana okutegeera ebirala.`,
  // "[name], your loan application was not approved.[Reason: ...] Please come to our offices to discuss further."

  loanDisbursed: (fullName: string, amount: string, loanRef: string) =>
    `${fullName}, ssente z'oloan zawo ez'${amount} zisinziidde ku account yo. Ref: ${loanRef}. Twebaza nnyo okusigalira nafe — Weereza ennono!`,
  // "[name], your loan money of [amount] has been deposited to your account. Ref: [ref]. We are very grateful for staying with us — Use it well!"

  loanRepayment: (fullName: string, amount: string, balance: string) =>
    `${fullName}, tufunye ssente z'okusasula oloan zawo ez'${amount}. Obuliro obusigala: ${balance}. Webale nnyo okusasula — Twebaza!`,
  // "[name], we have received your loan payment of [amount]. Remaining balance: [balance]. Thank you very much for paying — We are grateful!"

  loanReminder3Days: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `${fullName}, oloan lwayo (Ref: ${loanRef}) lw'obuliro bw'${balance} lujja okuggwa ku ${dueDate} — ennaku ssatu (3) ezisigadde. Nsaba oteekateeke ssente z'okusasula okulwanula omuze.`,
  // "[name], your loan (Ref: [ref]) with balance [balance] is due on [date] — 3 days remaining. Please prepare money to pay to avoid a fine."

  loanReminder1Day: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `${fullName}, EKIBUUZO KY'OMUWENDO: Oloan lwayo (Ref: ${loanRef}) lw'obuliro bw'${balance} lujja okuggwa ENKYA (${dueDate}). Nsaba osasule LEERO okuggibwa omuze ogw'okukoma.`,
  // "[name], PAYMENT REMINDER: Your loan (Ref: [ref]) with balance [balance] is due TOMORROW ([date]). Please pay TODAY to avoid a late fine."

  loanReminderToday: (fullName: string, loanRef: string, balance: string) =>
    `${fullName}, oloan lwayo (Ref: ${loanRef}) lw'obuliro bw'${balance} LUGGWA LEERO! Nsaba osasule mangu okuweebwa obuzibu bw'omuze ogw'okwongera.`,
  // "[name], your loan (Ref: [ref]) with balance [balance] IS DUE TODAY! Please pay quickly to avoid an additional fine penalty."

  loanOverdue: (fullName: string, loanRef: string, balance: string, daysOverdue: number) =>
    `${fullName}, oloan lwayo (Ref: ${loanRef}) LUJAMBAATIDDE ennaku ${daysOverdue}. Obuliro obusigala: ${balance}. Nsaba ozze mangu okusasula oba otuweereze ku bifo byaffe okulabagana n'okuggibwa obuzibu obutebuuka.`,
  // "[name], your loan (Ref: [ref]) IS OVERDUE by [n] days. Remaining balance: [balance]. Please come quickly to pay or contact our offices to discuss and avoid a growing problem."
}

// ─── Bilingual (Both) Templates ───────────────────────────────────────────────
// Sends both English and Luganda separated by a divider.
// Note: multi-part SMS (over 160 chars) incur extra credit costs.

const both = {
  welcome: (fullName: string, memberCode: string) =>
    `${english.welcome(fullName, memberCode)}\n---\n${luganda.welcome(fullName, memberCode)}`,

  loanApproved: (fullName: string, amount: number, memberCode: string) =>
    `${english.loanApproved(fullName, amount, memberCode)}\n---\n${luganda.loanApproved(fullName, amount, memberCode)}`,

  loanRejected: (fullName: string, memberCode: string) =>
    `${english.loanRejected(fullName, memberCode)}\n---\n${luganda.loanRejected(fullName, memberCode)}`,

  savingsDeposit: (fullName: string, amount: number, balance: number, memberCode: string) =>
    `${english.savingsDeposit(fullName, amount, balance, memberCode)}\n---\n${luganda.savingsDeposit(fullName, amount, balance, memberCode)}`,

  meetingReminder: (fullName: string, date: string, time: string, venue: string) =>
    `${english.meetingReminder(fullName, date, time, venue)}\n---\n${luganda.meetingReminder(fullName, date, time, venue)}`,

  passwordReset: (fullName: string, expiresIn: number = 15) =>
    `${english.passwordReset(fullName, expiresIn)}\n---\n${luganda.passwordReset(fullName, expiresIn)}`,

  fineIssued: (fullName: string, amount: string, reason: string | null) =>
    `${english.fineIssued(fullName, amount, reason)}\n---\n${luganda.fineIssued(fullName, amount, reason)}`,

  loanDeclined: (fullName: string, reason: string) =>
    `${english.loanDeclined(fullName, reason)}\n---\n${luganda.loanDeclined(fullName, reason)}`,

  loanDisbursed: (fullName: string, amount: string, loanRef: string) =>
    `${english.loanDisbursed(fullName, amount, loanRef)}\n---\n${luganda.loanDisbursed(fullName, amount, loanRef)}`,

  loanRepayment: (fullName: string, amount: string, balance: string) =>
    `${english.loanRepayment(fullName, amount, balance)}\n---\n${luganda.loanRepayment(fullName, amount, balance)}`,

  loanReminder3Days: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `${english.loanReminder3Days(fullName, loanRef, balance, dueDate)}\n---\n${luganda.loanReminder3Days(fullName, loanRef, balance, dueDate)}`,

  loanReminder1Day: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `${english.loanReminder1Day(fullName, loanRef, balance, dueDate)}\n---\n${luganda.loanReminder1Day(fullName, loanRef, balance, dueDate)}`,

  loanReminderToday: (fullName: string, loanRef: string, balance: string) =>
    `${english.loanReminderToday(fullName, loanRef, balance)}\n---\n${luganda.loanReminderToday(fullName, loanRef, balance)}`,

  loanOverdue: (fullName: string, loanRef: string, balance: string, daysOverdue: number) =>
    `${english.loanOverdue(fullName, loanRef, balance, daysOverdue)}\n---\n${luganda.loanOverdue(fullName, loanRef, balance, daysOverdue)}`,
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const englishTemplates = english
export const lugandaTemplates = luganda
export const bothTemplates = both

/**
 * Returns the SMS template set for the given language preference.
 * Falls back to English if language is unrecognised.
 */
export function getSmsTemplates(language: SmsLanguage | string | undefined = "english") {
  if (language === "luganda") return luganda
  if (language === "both") return both
  return english
}
