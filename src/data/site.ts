/**
 * Who runs this site. The site is Sato Shoko's own political-activity and
 * policy site, operated by her personally (she also represents the
 * supporters' association). She is the controller of personal information
 * and, for the planned citizen-submission feature, the person who manages
 * and reviews submissions.
 */
export const operator = {
  name: '佐藤祥子',
  /** Name with reading, for the first mention on a page */
  displayName: '佐藤祥子（さとうしょうこ）',
  address: '山口県宇部市大字東岐波5188-1',
  /** Obfuscated against simple address scrapers; same form as the contact section */
  emailDisplay: 'shoko.sato.office[アット]gmail.com',
}

/**
 * The supporters' association (represented by the operator). Shown where the
 * association itself is meant: contact section, join form, copyright line.
 */
export const supportersAssociation = 'さとうしょうこ後援会'

/** Date the current privacy policy took effect (YYYY-MM-DD). Update on every revision. */
export const privacyPolicyDate = '2026-11-20'
