/**
 * sms-templates.ts
 *
 * Multilingual SMS templates for the SACCO application.
 * Supports English, Luganda, and bilingual (both) messaging.
 *
 * Each template is a pure function: pass named data, get back a ready-to-send
 * string. The `getSmsTemplates()` helper returns the correct set based on the
 * member's language preference stored in settings.
 *
 * ── Luganda glossary ──────────────────────────────────────────────────────────
 *   ssente          = money
 *   okutereka       = savings / to save / to keep
 *   okusasula       = to pay / to settle a payment
 *   omuwendo        = amount / price
 *   balansi         = balance / remaining amount
 *   engasi          = fine / penalty
 *   looni          = loan (borrowed English, standard in Ugandan SACCOs)
 *   obukutu         = membership
 *   namba           = number
 *   kati            = now / currently
 *   ennaku          = days
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
 *   kakasidwa       = it has been approved
 *   eyiseko         = it is overdue / it has passed its date
 *   ezisigadde      = remaining (plural)
 */

// ─── Language type ────────────────────────────────────────────────────────────

export type SmsLanguage = "english" | "luganda" | "both"

// ─── Shared constants ─────────────────────────────────────────────────────────

/** ISO currency prefix used in every money-related message. */
const CURRENCY = "UGX"

/** Separator line inserted between English and Luganda in bilingual messages. */
const BILINGUAL_DIVIDER = "\n---\n"

/** Default OTP / password-reset expiry window shown to the member. */
const DEFAULT_EXPIRY_MINUTES = 15

// ─── English templates ────────────────────────────────────────────────────────

const english = {
  /** Sent when a new member is registered. */
  welcome: (fullName: string, memberCode: string) =>
    `Welcome to our SACCO, ${fullName}! Your member code is ${memberCode}. Keep this code for all your transactions. Thank you for joining us!`,

  /** Sent after a loan application is approved by management. */
  loanApproved: (fullName: string, amount: number, memberCode: string) =>
    `Dear ${fullName}, your loan application of ${CURRENCY} ${amount.toLocaleString()} has been approved. Member code: ${memberCode}. Thank you!`,

  /** Sent when a loan application is declined without a specific reason (initial rejection). */
  loanRejected: (fullName: string, memberCode: string) =>
    `Dear ${fullName}, your loan application has been declined. Please visit us for more information. Member code: ${memberCode}.`,

  /** Sent after a savings deposit is recorded on the member's account. */
  savingsDeposit: (fullName: string, amount: number, balance: number, memberCode: string) =>
    `Dear ${fullName}, we have received your savings of ${CURRENCY} ${amount.toLocaleString()}. New balance: ${CURRENCY} ${balance.toLocaleString()}. Member code: ${memberCode}. Thank you!`,

  /** Sent as a general meeting attendance reminder. */
  meetingReminder: (fullName: string, date: string, time: string, venue: string) =>
    `Dear ${fullName}, reminder: General meeting on ${date} at ${time}. Venue: ${venue}. Your attendance is important!`,

  /** Sent when a member triggers a password reset. */
  passwordReset: (fullName: string, expiresIn: number = DEFAULT_EXPIRY_MINUTES) =>
    `Dear ${fullName}, you requested a password reset. This expires in ${expiresIn} minutes. If you did not request this, please ignore.`,

  /** Sent when a fine is posted to the member's account. */
  fineIssued: (fullName: string, amount: string, reason: string | null) =>
    `Dear ${fullName}, a fine of ${amount} has been issued on your account.${reason ? ` Reason: ${reason}.` : ""} Please settle this promptly.`,

  /** Sent when a loan is formally declined, optionally with a reason. */
  loanDeclined: (fullName: string, reason: string) =>
    `Dear ${fullName}, your loan application has been declined.${reason ? ` Reason: ${reason}.` : ""} Contact us for more information.`,

  /** Sent when loan funds have been transferred to the member's account. */
  loanDisbursed: (fullName: string, amount: string, loanRef: string) =>
    `Dear ${fullName}, your loan of ${amount} has been disbursed to your account. Ref: ${loanRef}. Thank you for banking with us!`,

  /** Sent when a loan repayment instalment is received. */
  loanRepayment: (fullName: string, amount: string, balance: string) =>
    `Dear ${fullName}, we have received your loan payment of ${amount}. Remaining balance: ${balance}. Thank you!`,

  /** Sent 3 days before the loan due date as an early warning. */
  loanReminder3Days: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `Dear ${fullName}, your loan (Ref: ${loanRef}) balance of ${balance} is due on ${dueDate} — 3 days from now. Please arrange payment to avoid penalties.`,

  /** Sent the day before the loan due date as an urgent reminder. */
  loanReminder1Day: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `Dear ${fullName}, REMINDER: Your loan (Ref: ${loanRef}) balance of ${balance} is due TOMORROW (${dueDate}). Please pay today to avoid late fees.`,

  /** Sent on the actual due date of the loan. */
  loanReminderToday: (fullName: string, loanRef: string, balance: string) =>
    `Dear ${fullName}, your loan (Ref: ${loanRef}) balance of ${balance} is DUE TODAY. Please pay immediately to avoid penalties.`,

  /** Sent when a loan has passed its due date without full repayment. */
  loanOverdue: (fullName: string, loanRef: string, balance: string, daysOverdue: number) =>
    `Dear ${fullName}, your loan (Ref: ${loanRef}) is OVERDUE by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}. Outstanding balance: ${balance}. Please pay immediately or contact us to avoid further action.`,
}

// ─── Luganda templates ────────────────────────────────────────────────────────
// Grammar notes:
//  • Luganda verbs agree with noun class (oku- infinitive prefix).
//  • "okusasula" = to pay/settle; "okusasulwa" = to be paid.
//  • Subject agreement: "tu-" (we), "ba-" (they, 3rd person plural).
//  • Tense markers: "-a-" past, "-ja-" future.
//  • "Nsaba" = "I request / please" — polite imperative form.

const luganda = {
  /** Sent when a new member is registered. */
  welcome: (fullName: string, memberCode: string) =>
    `Tukusanyukidde nnyo mu SACCO yaffe, ${fullName}! Namba yo y'obukutu ye ${memberCode}. Tereka namba eno bulungi eri okukozesa mu bikolwa byonna. Webale nyo okutwegatta!`,
  // "We are very pleased to have you in our SACCO, [name]! Your membership number is [code]. Keep this number well for use in all transactions. Thank you very much for joining us!"

  /** Sent after a loan application is approved by management. */
  loanApproved: (fullName: string, amount: number, memberCode: string) =>
    `${fullName}, essuubi lyo ly'looni erya ${CURRENCY} ${amount.toLocaleString()} kakasidwa! Namba y'obukutu: ${memberCode}. Webale okusigalira nafe — Twebaza nnyo!`,
  // "[name], your loan application of UGX [amount] has been approved! Member code: [code]. Thank you for staying with us — We are very grateful!"

  /** Sent when a loan application is declined without a specific reason. */
  loanRejected: (fullName: string, memberCode: string) =>
    `${fullName}, essuubi lyo ly'looni sirinaaganiririzibwa. Nsaba ozze ku bifo byaffe okulabagana okutegeera ensonga. Namba y'obukutu: ${memberCode}.`,
  // "[name], your loan application was not approved. Please come to our offices to understand the reason. Member code: [code]."

  /** Sent after a savings deposit is recorded on the member's account. */
  savingsDeposit: (fullName: string, amount: number, balance: number, memberCode: string) =>
    `${fullName}, tufunye okutereka kwammwe okwa ${CURRENCY} ${amount.toLocaleString()}. Okutereka kwammwe kwonna kati buli ${CURRENCY} ${balance.toLocaleString()}. Namba y'obukutu: ${memberCode}. Webale okutereka!`,
  // "[name], we have received your savings of UGX [amount]. Your total savings are now UGX [balance]. Member code: [code]. Thank you for saving!"

  /** Sent as a general meeting attendance reminder. */
  meetingReminder: (fullName: string, date: string, time: string, venue: string) =>
    `${fullName}, ekibuuzo: Okukuŋŋaana kw'amazima ku ${date} nga ssaawa ${time}. Ekifo: ${venue}. Okujja kwammwe kwa waggulu nnyo — Nsaba ojje!`,
  // "[name], a reminder: The important meeting is on [date] at [time]. Venue: [venue]. Your attendance is very important — Please come!"

  /** Sent when a member triggers a password reset. */
  passwordReset: (fullName: string, expiresIn: number = DEFAULT_EXPIRY_MINUTES) =>
    `${fullName}, wasaba okukyusa password yo. Okulambula kuno kujja okuggwa mu edakiika ${expiresIn}. Bw'oteleka kasaba kino, sikireba.`,
  // "[name], you requested to change your password. This link will expire in [n] minutes. If you did not request this, please ignore it."

  /** Sent when a fine is posted to the member's account. */
  fineIssued: (fullName: string, amount: string, reason: string | null) =>
    `${fullName}, engasi ya ${amount} yateeredwa ku account yo.${reason ? ` Ensonga: ${reason}.` : ""} Nsaba osasule mangu okuggibwa obuzibu obutono.`,
  // "[name], a fine of [amount] has been placed on your account.[Reason: ...] Please pay quickly to avoid a bigger problem."

  /** Sent when a loan is formally declined, optionally with a reason. */
  loanDeclined: (fullName: string, reason: string) =>
    `${fullName}, essuubi lyo ly'looni silinaaganiririzibwa.${reason ? ` Ensonga: ${reason}.` : ""} Nsaba ozze ku bifo byaffe okulabagana okutegeera ebirala.`,
  // "[name], your loan application was not approved.[Reason: ...] Please come to our offices to discuss further."

  /** Sent when loan funds have been transferred to the member's account. */
  loanDisbursed: (fullName: string, amount: string, loanRef: string) =>
    `${fullName}, ssente z'looni zawo ez'${amount} zisinziidde ku account yo. Ref: ${loanRef}. Twebaza nnyo okusigalira nafe — Weereza ennono!`,
  // "[name], your loan money of [amount] has been deposited to your account. Ref: [ref]. We are very grateful for staying with us — Use it well!"

  /** Sent when a loan repayment instalment is received. */
  loanRepayment: (fullName: string, amount: string, balance: string) =>
    `${fullName}, tufunye ssente z'okusasula looni zawo ez'${amount}. Balansi esigadde: ${balance}. Webale nnyo okusasula — Twebaza!`,
  // "[name], we have received your loan payment of [amount]. Remaining balance: [balance]. Thank you very much for paying — We are grateful!"

  /** Sent 3 days before the loan due date as an early warning. */
  loanReminder3Days: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `${fullName}, looni lwayo (Ref: ${loanRef}) lw'balansi bw'${balance} lujja okuggwa ku ${dueDate} — ennaku ssatu (3) ezisigadde. Nsaba oteekateeke ssente z'okusasula okulwanula engasi.`,
  // "[name], your loan (Ref: [ref]) with balance [balance] is due on [date] — 3 days remaining. Please prepare money to pay to avoid a fine."

  /** Sent the day before the loan due date as an urgent reminder. */
  loanReminder1Day: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `${fullName}, EKIBUUZO KY'OMUWENDO: Olooni lwayo (Ref: ${loanRef}) lw'balansi bw'${balance} lujja okuggwa ENKYA (${dueDate}). Nsaba osasule LEERO okuggibwa engasi ogw'okukoma.`,
  // "[name], PAYMENT REMINDER: Your loan (Ref: [ref]) with balance [balance] is due TOMORROW ([date]). Please pay TODAY to avoid a late fine."

  /** Sent on the actual due date of the loan. */
  loanReminderToday: (fullName: string, loanRef: string, balance: string) =>
    `${fullName}, looni lwayo (Ref: ${loanRef}) lw'balansi bw'${balance} LUGGWA LEERO! Nsaba osasule mangu okuweebwa obuzibu bw'engasi ogw'okwongera.`,
  // "[name], your loan (Ref: [ref]) with balance [balance] IS DUE TODAY! Please pay quickly to avoid an additional fine penalty."

  /** Sent when a loan has passed its due date without full repayment. */
  loanOverdue: (fullName: string, loanRef: string, balance: string, daysOverdue: number) =>
    `${fullName}, looni lwayo (Ref: ${loanRef}) EYISEKO ennaku ${daysOverdue}. Balansi esigadde: ${balance}. Nsaba ozze mangu okusasula oba otuweereze ku bifo byaffe okulabagana n'okuggibwa obuzibu obutebuuka.`,
  // "[name], your loan (Ref: [ref]) IS OVERDUE by [n] days. Remaining balance: [balance]. Please come quickly to pay or contact our offices to discuss and avoid a growing problem."
}

// ─── Bilingual templates ──────────────────────────────────────────────────────
// Composes English + Luganda separated by BILINGUAL_DIVIDER.
// Note: messages over 160 characters are split into multiple SMS parts,
// which incurs additional credit costs with the EGO SMS gateway.

const both = {
  welcome: (fullName: string, memberCode: string) =>
    `${english.welcome(fullName, memberCode)}${BILINGUAL_DIVIDER}${luganda.welcome(fullName, memberCode)}`,

  loanApproved: (fullName: string, amount: number, memberCode: string) =>
    `${english.loanApproved(fullName, amount, memberCode)}${BILINGUAL_DIVIDER}${luganda.loanApproved(fullName, amount, memberCode)}`,

  loanRejected: (fullName: string, memberCode: string) =>
    `${english.loanRejected(fullName, memberCode)}${BILINGUAL_DIVIDER}${luganda.loanRejected(fullName, memberCode)}`,

  savingsDeposit: (fullName: string, amount: number, balance: number, memberCode: string) =>
    `${english.savingsDeposit(fullName, amount, balance, memberCode)}${BILINGUAL_DIVIDER}${luganda.savingsDeposit(fullName, amount, balance, memberCode)}`,

  meetingReminder: (fullName: string, date: string, time: string, venue: string) =>
    `${english.meetingReminder(fullName, date, time, venue)}${BILINGUAL_DIVIDER}${luganda.meetingReminder(fullName, date, time, venue)}`,

  passwordReset: (fullName: string, expiresIn: number = DEFAULT_EXPIRY_MINUTES) =>
    `${english.passwordReset(fullName, expiresIn)}${BILINGUAL_DIVIDER}${luganda.passwordReset(fullName, expiresIn)}`,

  fineIssued: (fullName: string, amount: string, reason: string | null) =>
    `${english.fineIssued(fullName, amount, reason)}${BILINGUAL_DIVIDER}${luganda.fineIssued(fullName, amount, reason)}`,

  loanDeclined: (fullName: string, reason: string) =>
    `${english.loanDeclined(fullName, reason)}${BILINGUAL_DIVIDER}${luganda.loanDeclined(fullName, reason)}`,

  loanDisbursed: (fullName: string, amount: string, loanRef: string) =>
    `${english.loanDisbursed(fullName, amount, loanRef)}${BILINGUAL_DIVIDER}${luganda.loanDisbursed(fullName, amount, loanRef)}`,

  loanRepayment: (fullName: string, amount: string, balance: string) =>
    `${english.loanRepayment(fullName, amount, balance)}${BILINGUAL_DIVIDER}${luganda.loanRepayment(fullName, amount, balance)}`,

  loanReminder3Days: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `${english.loanReminder3Days(fullName, loanRef, balance, dueDate)}${BILINGUAL_DIVIDER}${luganda.loanReminder3Days(fullName, loanRef, balance, dueDate)}`,

  loanReminder1Day: (fullName: string, loanRef: string, balance: string, dueDate: string) =>
    `${english.loanReminder1Day(fullName, loanRef, balance, dueDate)}${BILINGUAL_DIVIDER}${luganda.loanReminder1Day(fullName, loanRef, balance, dueDate)}`,

  loanReminderToday: (fullName: string, loanRef: string, balance: string) =>
    `${english.loanReminderToday(fullName, loanRef, balance)}${BILINGUAL_DIVIDER}${luganda.loanReminderToday(fullName, loanRef, balance)}`,

  loanOverdue: (fullName: string, loanRef: string, balance: string, daysOverdue: number) =>
    `${english.loanOverdue(fullName, loanRef, balance, daysOverdue)}${BILINGUAL_DIVIDER}${luganda.loanOverdue(fullName, loanRef, balance, daysOverdue)}`,
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const englishTemplates = english
export const lugandaTemplates = luganda
export const bothTemplates = both

/**
 * Returns the SMS template set for the given language preference.
 * Falls back to English when the language value is unrecognised or undefined.
 *
 * @param language - "english" | "luganda" | "both"
 */
export function getSmsTemplates(language: SmsLanguage | string | undefined = "english") {
  if (language === "luganda") return luganda
  if (language === "both") return both
  return english
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// AVAILABLE TEMPLATE KEYS (all three sets share the same keys):
//   welcome            – new member registration
//   loanApproved       – loan application approved
//   loanRejected       – loan declined, no reason given
//   loanDeclined       – loan declined with optional reason
//   loanDisbursed      – loan funds sent to member account
//   loanRepayment      – instalment payment received
//   loanReminder3Days  – due-date warning, 3 days out
//   loanReminder1Day   – due-date warning, 1 day out
//   loanReminderToday  – due-date warning, same day
//   loanOverdue        – loan past due date
//   savingsDeposit     – savings deposit confirmed
//   meetingReminder    – general meeting reminder
//   fineIssued         – fine posted to account
//   passwordReset      – password-reset OTP trigger
//
// USAGE EXAMPLE:
//   import { getSmsTemplates } from "@/lib/sms-templates"
//   const sms = getSmsTemplates(member.smsLanguage)
//   const message = sms.loanApproved(member.fullName, 500000, member.memberCode)
//
// CONSTANTS:
//   CURRENCY               = "UGX"
//   BILINGUAL_DIVIDER      = "\n---\n"
//   DEFAULT_EXPIRY_MINUTES = 15
//
// RELATED FILES:
//   lib/sms.ts                    – sendSms() delivery function (EGO SMS gateway)
//   lib/notification-queue.ts     – queues SMS jobs for background processing
//   lib/sms-luganda-reference.md  – human-readable Luganda ↔ English reference
