/**
 * Read-only snapshot of the live advisor_guidance_chunks corpus (42 rows),
 * exported via the Supabase Management API on 2026-09-30T03:19:18.664Z.
 *
 * The golden eval grounds every case against this committed snapshot so the
 * suite is deterministic and runs without credentials. Re-export with
 * scripts/check-advisor-golden.mjs --export-corpus to refresh it when the
 * live corpus changes deliberately; the file is versioned so every corpus
 * change is reviewed.
 */

import type { GuidanceChunk } from '../../../../../supabase/functions/advisor-chat/responsePayload'

export interface CorpusSnapshotRow extends GuidanceChunk {
  readonly status?: string | null
}

export const ADVISOR_CORPUS_SNAPSHOT: readonly CorpusSnapshotRow[] = [
  {
    "jurisdiction": "FED",
    "topic": "accommodation_basics",
    "title": "Duty to accommodate under the Canadian Human Rights Act",
    "content": "Federally regulated employers are covered by the Canadian Human Rights Act (Loi canadienne sur les droits de la personne), administered by the Canadian Human Rights Commission (Commission canadienne des droits de la personne). The Act prohibits discrimination based on protected grounds: race, national or ethnic origin, colour, religion, age, sex, sexual orientation, gender identity or expression, marital status, family status, disability, genetic characteristics, and a conviction for which a pardon has been granted or a record suspended. Employers have a duty to accommodate (obligation d'adaptation, mesures d'adaptation): they must adjust rules, policies, practices or physical spaces so that employees with needs related to a protected ground can participate fully — for example, modified schedules for caregiving or time off for medical appointments. The duty extends to the point of undue hardship (contrainte excessive), such as excessive cost or health and safety risks, which the employer must support with evidence. An employee who rejects a reasonable accommodation cannot insist on the ideal option; the employer is then considered to have met its duty.",
    "source_url": "https://www.chrc-ccdp.gc.ca/individuals/human-rights/duty-accommodate",
    "source_name": "Canadian Human Rights Commission (CHRC / CCDP)",
    "effective_note": "Retrieved 2026-07-27; the CHRC page displays a dynamically generated modification date.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "constructive_dismissal",
    "title": "Federal — Constructive dismissal and unjust dismissal complaints (Canada Labour Code)",
    "content": "The unjust dismissal provisions in Part III of the Canada Labour Code (s.240) apply to constructive dismissals as well as to dismissals made by open, unambiguous employer action. The Labour Program's interpretation guide (IPG-033) defines constructive dismissal as a situation where the employer has not directly fired the employee but has failed to comply with the employment contract in a major respect, unilaterally changed the terms of employment, or expressed a settled intention to do either — sometimes called \"disguised dismissal\" or \"quitting with cause\" — distinguishing it from an ordinary resignation by the employer's failure to meet its contractual obligations. An employee (other than a manager or someone covered by a collective agreement) who has completed at least 12 consecutive months of continuous employment may file an unjust dismissal complaint, including one based on constructive dismissal, within 90 days of the dismissal. If the Board finds the dismissal unjust, it may order reinstatement, compensation up to what the employee would have earned had they not been dismissed, and any other fair remedy.",
    "source_url": "https://www.canada.ca/en/employment-social-development/programs/laws-regulations/labour/interpretations-policies/constructive-dismissal.html",
    "source_name": "Canada.ca — Constructive dismissal (IPG-033); Termination, layoff or dismissal (Unjust dismissal)",
    "effective_note": "Canada Labour Code s.240; verified against live canada.ca pages on 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "hours_of_work",
    "title": "Hours of work, breaks and rest periods (Canada Labour Code)",
    "content": "Under the Canada Labour Code, standard hours of work (durée normale du travail) for federally regulated employees are 8 hours in a day and 40 hours in a week. Hours beyond standard hours are overtime (heures supplémentaires), paid at least 1.5 times the regular hourly wage or, by written agreement, banked as 1.5 hours of paid time off per overtime hour. Maximum hours of work are 48 in a week in most cases, exceedable only under an excess-hours permit, emergency work, averaging, or a modified work schedule. Employees are entitled to an unpaid break (pause) of at least 30 minutes every 5 consecutive hours of work (paid if the employee must stay at the employer's disposal), a rest period of at least 8 consecutive hours between shifts, and one full day of rest each week, usually Sunday. Employers must give written notice of schedules at least 96 hours before the schedule starts — employees may refuse shifts starting within that window — and 24 hours' notice of shift changes. Managers and certain professionals are excluded.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/work-hours.html",
    "source_name": "Employment and Social Development Canada (Canada.ca)",
    "effective_note": "Official page last modified 2026-03-24. Sector regulations (e.g., trucking, shipping, rail) modify these rules for some employee classes.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "layoffs_recall",
    "title": "Federal — Temporary layoff and recall rules (Canada Labour Code)",
    "content": "Under Part III of the Canada Labour Code and the Canada Labour Standards Regulations, a temporary layoff of a federally regulated employee is not deemed a termination of employment where: the layoff results from a strike or lockout; the layoff lasts three months or less; the layoff lasts more than three months and the employer notifies the employee in writing, at or before the layoff, of a fixed recall date or period no more than six months away and recalls them accordingly; the layoff lasts more than three months and the employee keeps receiving agreed payments, employer pension or group-insurance contributions, or supplementary unemployment benefits (or would qualify for them but for disqualification under the Employment Insurance Act); the layoff lasts 12 months or less and is mandatory under a collective agreement's minimum work guarantee; or the layoff lasts more than three but not more than 12 months and the employee keeps recall rights under a collective agreement throughout. A layoff outside these conditions becomes a termination of employment, and an employee who does not return to work after a valid recall is deemed to have quit and is not entitled to severance pay.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/termination.html",
    "source_name": "Canada.ca — Termination, layoff or dismissal (federal labour standards); Canada Labour Standards Regulations s.30",
    "effective_note": "Canada Labour Standards Regulations s.30(1)-(2); verified against the live canada.ca page on 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "leaves",
    "title": "Canada Labour Code statutory leaves (federally regulated employers)",
    "content": "Under Part III of the Canada Labour Code (Code canadien du travail), federally regulated employees have job-protected leaves. Medical leave with pay (congé payé pour raisons médicales): up to 10 days per year, accrued as 3 days after 30 days' continuous employment then 1 day per completed month, with unused days carrying over to a maximum of 10. Unpaid medical leave: up to 27 weeks. Bereavement leave (congé de décès): up to 10 days, first 3 paid after 3 months' continuous employment; up to 8 weeks if the employee's child dies. Personal leave (congé personnel): up to 5 days per calendar year, first 3 paid after 3 months. Leave for victims of family violence (congé pour les victimes de violence familiale): up to 10 days per calendar year, first 5 paid after 3 months. Leave for traditional Aboriginal practices (congé pour pratiques autochtones traditionnelles): up to 5 days per calendar year, unpaid, after 3 months. Leave related to pregnancy loss (congé en cas de perte de grossesse), Canada Labour Code s. 206.51: up to 8 weeks if the pregnancy resulted in a stillbirth, or 3 days in any other case where a pregnancy does not result in a live birth; available to the employee, their spouse or common-law partner, and a person who intended to be the legal parent; the period begins on the day the pregnancy does not result in a live birth and ends 26 weeks after that day; the first 3 days are paid after 3 consecutive months of continuous employment; the leave may be taken in one or two periods. Compassionate care leave (congé de soignant): up to 28 weeks within 52 weeks. Critical illness leave (congé en cas de maladie grave): up to 37 weeks for a child under 18, 17 weeks for an adult, within 52 weeks. Maternity leave (congé de maternité): up to 17 weeks; parental leave (congé parental): up to 63 weeks, or 71 weeks shared between two federally regulated parents; combined maternity and parental maximum 78 weeks, or 86 weeks shared. Maternity and parental leaves are unpaid; Employment Insurance (or QPIP in Quebec) benefits are separate. Leave for court or jury duty (congé pour fonctions judiciaires): unpaid leave for the time necessary to participate in a judicial proceeding as a witness, juror, or candidate in a jury selection process; requires written notice to the employer, who may request supporting documents. Leave for work-related illness and injury (congé pour accident ou maladie professionnel): unpaid leave for an employee who suffers a work-related illness or injury; employers must subscribe to a plan replacing wages at a rate equivalent to the workers' compensation rate in the employee's province of permanent residence; where reasonably practicable the employer must return the employee to work afterward, or may reassign them to a different position with different terms and conditions if they cannot perform their original job. Leave of absence for members of the reserve force (congé pour les membres de la force de réserve), Canada Labour Code s. 247.5: after 3 consecutive months of continuous employment, unpaid leave to take part in an operation in Canada or abroad designated by the Minister of National Defence, a prescribed activity, Canadian Armed Forces military skills training, training or duties the reservist is ordered or called out to perform, service in aid of the civil power, or treatment, recovery or rehabilitation for a physical or mental health problem resulting from such service, all under the National Defence Act; reservists are entitled to 24 months of leave in a 60-month period, except during a national emergency within the meaning of the Emergencies Act; the Labour Program may deny the leave if it would cause undue hardship to the employer or an adverse effect on public health or safety. Maternity-related reassignment and leave (réaffectation et congé liés à la maternité): a pregnant or nursing employee may ask their employer, with a healthcare practitioner's certificate, to modify their job or reassign them where continuing their present work poses a risk to their health, the health of their unborn child, or the health of their child; while the employer examines the request the employee is entitled to leave with pay at their regular rate of wages; where reassignment or job modification is not reasonably practicable, the employee is entitled to an unpaid leave of absence for the duration of the risk, available from the beginning of the pregnancy to the end of the 24th week following the birth.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/leaves.html",
    "source_name": "Employment and Social Development Canada (Canada.ca)",
    "effective_note": "Official page last modified 2026-05-13 (EN and FR identical). Medical leave with pay has applied since December 1, 2022 — the only leave on the page carrying a stated in-force date. Leave related to pregnancy loss was enacted by 2024, c. 15, s. 198; the Canada Labour Code Amendments table gives that instrument an \"Amendment date\" of 2025-12-12, matching the Act currency line \"last amended on 2025-12-12\"; no per-section coming-into-force date is published. NOT on the official page and NOT in the corpus: any \"leave for the placement of a child\" — no such section exists in Part III Division VII. Verified 2026-08-04 (two independent fetches, EN + FR, plus the consolidated statute). Update 2026-08-05: added the four leaves TODO.md L1b recorded as still-omitted -- court or jury duty, work-related illness and injury, reserve force (24 months in a 60-month period, Canada Labour Code s. 247.5(1.1)), and maternity-related reassignment and leave -- none of which carry a stated per-section coming-into-force date on the official page. Page Date modified / Date de modification unchanged at 2026-05-13 in both languages; these were 2026-07-27 authoring omissions, confirmed by two independent EN fetches (byte-identical) plus one FR fetch on 2026-08-05, and the s. 247.5 citation cross-checked against the consolidated statute text. Canada Labour Code: s. 239 (medical leave — paid and unpaid), s. 210 (bereavement leave). Verified against the consolidated Canada Labour Code text (laws-lois L-2) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "minimum_wage",
    "title": "Federal minimum wage — federally regulated employers",
    "content": "Effective April 1, 2026, the federal minimum wage (salaire minimum fédéral) is $18.15 per hour for employees, including interns, working in federally regulated businesses and industries; the previous rate, effective April 1, 2025, was $17.75 per hour. Under Canada Labour Code s. 178.1, the federal minimum wage is adjusted on April 1 each year by multiplying the previous rate by the ratio of the Consumer Price Index for the preceding calendar year to the index for the year before that, and rounding the result up to the nearest $0.05. Section 178.1(3) defines that index precisely as the average of the all-items Consumer Price Index for Canada, not seasonally adjusted, for each month in the calendar year. Section 178.1(4) provides that no adjustment is made where the calculation would produce a rate lower than the rate already in force, so the federal minimum wage cannot fall. If the minimum wage set by the province or territory where the employee works is greater than the federal minimum wage, the higher provincial or territorial rate applies. Employees not paid on an hourly basis must receive at least the equivalent of the minimum wage, and an employee who reports to work at the call of the employer must receive wages for at least 3 hours at their regular rate, whether or not work is performed.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/pay-deductions.html",
    "source_name": "Canada.ca — Federal labour standards (ESDC), Pay and minimum wage, deductions, and wage recovery",
    "effective_note": "Rate $18.15/hour effective 2026-04-01 (previous $17.75 effective 2025-04-01); canada.ca page dcterms.modified 2026-04-01. Next adjustment falls on 2027-04-01 by operation of CLC s. 178.1(2); no successor rate is published. The indexation, rounding and no-downward-adjustment rules are sourced to CLC s. 178.1(2)-(4), NOT to the canada.ca page, which is silent on rounding in both languages. The prior claim that CPI \"rose 2.1% in 2025\" was removed as unverifiable from any official source. Verified 2026-08-04 (two independent fetches, EN + FR, plus the consolidated statute).",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "overtime",
    "title": "Hours of work and overtime — federally regulated employers (Canada Labour Code)",
    "content": "Under the Canada Labour Code (Code canadien du travail), standard hours of work for federally regulated employees are 8 hours in a day (any period of 24 consecutive hours) and 40 hours in a week (midnight Saturday to midnight the following Saturday). Any hours worked in excess of standard hours are overtime (heures supplémentaires), payable at a minimum of 1.5 times the regular hourly wage, or, with a written agreement, taken as time off with pay at 1.5 hours off for every overtime hour worked. If daily and weekly overtime totals differ, the employer must use the greater of the two. Maximum weekly hours are, in most cases, 48, and can be exceeded in exceptional circumstances such as an excess-hours permit, emergency work, an averaging plan or a modified work schedule. In a week with one or more general holidays, standard hours are reduced by 8 hours per holiday. The hours-of-work rules do not apply to managers, superintendents, employees exercising management functions, or members of the architectural, dental, engineering, legal or medical professions.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/work-hours.html",
    "source_name": "Canada.ca — Federal labour standards (ESDC), Hours of work",
    "effective_note": "Canada Labour Code: s. 169 (standard hours 8/day, 40/week), s. 171 (48-hour weekly maximum), s. 174 (1.5× overtime premium). Verified against the consolidated Canada Labour Code text (laws-lois L-2) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "pay_deductions",
    "title": "Federal — Permitted wage deductions and wage recovery (Canada Labour Code)",
    "content": "Under Part III of the Canada Labour Code, a federally regulated employer may deduct from an employee's wages only amounts: required by a federal or provincial statute or its regulations (such as income tax and Employment Insurance premiums); authorized by a court order, a collective agreement, or another document signed by a trade union on the employee's behalf; amounts the employee authorizes in writing (which must specify the amount, purpose, and frequency, and cannot be a blanket or coerced authorization); overpayments of wages by the employer; or amounts otherwise prescribed by regulation. An employer cannot deduct for property damage or loss of money or property without written consent if anyone other than the employee also had access to the property. On each pay day, the employer must give the employee a written statement of the pay period, hours paid, wage rate, deduction details, and the net amount received. The Labour Program can recover up to 24 months of unpaid wages, overtime, vacation pay, general holiday pay, severance pay, or pay in lieu of notice on an employee's behalf.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/pay-deductions.html",
    "source_name": "Canada.ca — Pay and minimum wage, deductions, and wage recovery (federal labour standards)",
    "effective_note": "Canada Labour Code s.254, s.254.1; verified against the live canada.ca page on 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "public_holidays",
    "title": "Federal general holidays and holiday pay (Canada Labour Code)",
    "content": "Federally regulated employees are entitled to a day off with pay for 10 general holidays (jours fériés) each year under the Canada Labour Code (Code canadien du travail): New Year's Day, Good Friday, Victoria Day, Canada Day, Labour Day, National Day for Truth and Reconciliation, Thanksgiving Day, Remembrance Day, Christmas Day and Boxing Day. For most employees, general holiday pay equals at least one-twentieth of the wages earned, excluding overtime, in the 4-week period before the week of the holiday. An employee required to work on a general holiday must receive at least 1.5 times the regular rate of wages for hours worked, in addition to general holiday pay; managers and professionals who work receive their regular rate plus a substitute holiday with pay. Continuous operations have alternative options, such as regular-rate pay plus a paid holiday at another time. Part-time employees get the same 10 holidays, with holiday pay adjusted to hours worked.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html",
    "source_name": "Employment and Social Development Canada (Canada.ca)",
    "effective_note": "Official page last modified 2025-12-12.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "records_retention",
    "title": "Federal — Employer payroll and employment record retention (Canada Labour Code)",
    "content": "Under Part III of the Canada Labour Code and the Canada Labour Standards Regulations, a federally regulated employer must keep an employment and payroll record for each employee — showing, among other things, start and end dates of employment, personal identifiers, rate of wages and changes to it, hours worked, and each pay day's earnings, deductions and net pay — for at least 36 months, and for a further 36 months after the employee's employment ends. Written employment statements, which employers must give employees within their first 30 days and update within 30 days of any change, must also be kept for 36 months after employment ends. Records for student interns must be kept for at least 36 months after the internship ends. Employers must make these records available for examination by the Labour Program's Head of Compliance and Enforcement at any reasonable time; where an employer fails to keep required records, the Labour Program may determine wages or amounts owed using the best available evidence.",
    "source_url": "https://www.canada.ca/en/employment-social-development/corporate/portfolio/labour/programs/labour-standards/employer-compliance.html",
    "source_name": "Canada.ca — Employer compliance with federal labour standards (Keeping records)",
    "effective_note": "Canada Labour Code s.252(2), s.253.2(3); Canada Labour Standards Regulations s.24; verified against the live canada.ca page on 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "severance",
    "title": "Severance pay — federally regulated employers (Canada Labour Code)",
    "content": "The federal jurisdiction has a distinct statutory severance entitlement, separate from termination notice. Under the Canada Labour Code (Code canadien du travail), an employer that terminates the employment of an employee who has completed at least 12 consecutive months of continuous employment must provide severance pay (indemnité de départ). Severance pay is the greater of: 2 days' wages, at the employee's regular rate of wages, for each full year the employee has worked for the employer, or 5 days' wages at the employee's regular rate of wages. Severance pay is owed in addition to notice of termination or pay in lieu of notice, and applies in both individual and group terminations. Severance pay is not required when a lay-off does not result in a termination of employment, when an employment contract contains an end date and the contract ends, when the employee is dismissed for just cause, or when the employee terminates their own employment.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/termination.html",
    "source_name": "Canada.ca — Federal labour standards (ESDC), Termination, layoff or dismissal",
    "effective_note": "Canada Labour Code, s. 235 (severance pay at 12+ months). Verified against the consolidated Canada Labour Code text (laws-lois L-2) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "termination_notice",
    "title": "Individual termination notice — federally regulated employers (Canada Labour Code, Part III)",
    "content": "Under the Canada Labour Code (Code canadien du travail), Part III, a federally regulated employer terminating an individual employee must provide a minimum of 2 weeks' written notice of termination (préavis de cessation d'emploi), pay regular wages in lieu of notice, or a combination of both. For an employee who has completed at least 3 years of service, the minimum notice is 1 week per completed year of employment, up to a maximum of 8 weeks: 3 weeks at 3 completed years, 4 weeks at 4 years, 5 weeks at 5 years, 6 weeks at 6 years, 7 weeks at 7 years, and 8 weeks at 8 or more years. No notice or pay in lieu is required if the employee has not completed 3 consecutive months of continuous employment, terminates their own employment, is dismissed for just cause, is on a temporary lay-off that is not a termination, or works under a contract that ends on its specified end date. Employers must also provide a statement of benefits detailing wages, vacation pay, severance pay and other amounts.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/termination.html",
    "source_name": "Canada.ca — Federal labour standards (ESDC), Termination, layoff or dismissal",
    "effective_note": null,
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "vacation",
    "title": "Annual vacation — federally regulated employers (Canada Labour Code)",
    "content": "Employees working for federally regulated employers are entitled under the Canada Labour Code (Code canadien du travail) to at least 2 weeks of vacation (congés annuels) annually after completing 1 year of employment with the same employer, 3 weeks annually after 5 consecutive years of employment, and 4 weeks annually after 10 consecutive years of employment. Vacation pay (indemnité de congé annuel) is a percentage of gross wages earned during the year of employment: 4% of earnings where the vacation is 2 weeks, 6% where it is 3 weeks, and 8% where it is 4 weeks. Vacation must begin no later than 10 months after each completed year of employment, and an employer scheduling vacation must give at least 2 weeks' notice. The employer may pay vacation pay within 14 days before the vacation begins. When employment ends, vacation pay owed for prior completed years must be paid within 30 days, plus vacation pay for the partially completed current year.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html",
    "source_name": "Canada.ca — Federal labour standards (ESDC), Annual vacations and general holidays",
    "effective_note": "Canada Labour Code, s. 184 (annual vacation entitlement) and s. 185 (granting vacation). Verified against the consolidated Canada Labour Code text (laws-lois L-2) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "FED",
    "topic": "workplace_injury_basics",
    "title": "Federal — No separate federal workers' compensation scheme for private-sector employees",
    "content": "Federally regulated private-sector employers (banks, telecommunications, interprovincial transportation, and similar industries) do not pay into or claim from a distinct federal workers' compensation board for ordinary workplace injuries. Federal government employees are compensated for work-related injury or illness under the Government Employees Compensation Act (GECA), administered by the Federal Workers' Compensation Service (FWCS) of Employment and Social Development Canada; FWCS partners with, and claims are adjudicated by, the provincial workers' compensation board of the province where the employee usually works — except employees usually working in Yukon, the Northwest Territories or Nunavut (adjudicated by the Alberta Workers' Compensation Board) and those usually working outside Canada (adjudicated by Ontario's WSIB). The provincial board pays compensation directly to the employee. Federal government employers complete an Employer's Report of Injury and submit it to FWCS; employees complete a Worker's Report of Injury and a Physician's Report and submit them to the applicable provincial board (or to FWCS for locally engaged employees abroad). Occupational health and safety for the federally regulated private sector is separately governed by Part II of the Canada Labour Code, but injury compensation itself still runs through the relevant provincial scheme.",
    "source_url": "https://www.canada.ca/en/services/jobs/workplace/health-safety/compensation/federal-workers.html",
    "source_name": "Canada.ca — Compensation for federal workers (Federal Workers' Compensation Service); How to submit a claim",
    "effective_note": "Government Employees Compensation Act; describes the GECA/provincial-WCB compensation pathway — this is an absence chunk analogous to the Quebec severance one, since there is no separate federal WSIB/CNESST equivalent for private-sector federally regulated workers, who are covered by the workers' compensation legislation of the province where they work. Verified against live canada.ca pages on 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "accommodation_basics",
    "title": "Ontario Human Rights Code and the duty to accommodate",
    "content": "Employment discrimination in Ontario is governed by the provincial Human Rights Code (Code des droits de la personne de l'Ontario), first enacted in 1962. The Code prohibits discrimination in employment and four other social areas on protected grounds (motifs protégés) including age, ancestry, colour, race, citizenship, ethnic origin, place of origin, creed, disability (handicap), family status, marital status, gender identity and gender expression, record of offences (employment only), sex (including pregnancy and breastfeeding) and sexual orientation. Employers have a duty to accommodate (obligation d'adaptation) employees' Code-related needs to the point of undue hardship (préjudice injustifié). Only three factors may be considered in assessing undue hardship — cost, outside sources of funding, and health and safety requirements — and the employer bears the onus of proving it. Accommodation must respect dignity, be individualized, and promote integration and full participation. The Ontario Human Rights Commission (Commission ontarienne des droits de la personne) develops policy and public education; discrimination applications are decided by the Human Rights Tribunal of Ontario (Tribunal des droits de la personne de l'Ontario), with the Human Rights Legal Support Centre assisting applicants.",
    "source_url": "https://www.ohrc.on.ca/en/ontario-human-rights-code",
    "source_name": "Ontario Human Rights Commission — The Ontario Human Rights Code",
    "effective_note": "Descriptive only; verified against live ohrc.on.ca pages (Code overview, rights-and-responsibilities guide, Policy on ableism ss. 8-9) on 2026-07-27. Ontario Human Rights Code, s. 5 (equal treatment in employment) and s. 17 (accommodation to the point of undue hardship). Verified against the consolidated e-Laws Human Rights Code text (90h19) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "constructive_dismissal",
    "title": "Ontario — Constructive dismissal under the ESA",
    "content": "Under Ontario's Employment Standards Act, 2000, a person's employment is treated as terminated if the employer constructively dismisses them and the employee resigns in response within a reasonable time. A constructive dismissal (congédiement déguisé) may occur when an employer makes a significant change to a fundamental term or condition of employment without the employee's actual or implied consent — for example, a significant cut to salary, or a significant negative change to work location, hours of work, authority, or position. It can also include an employer harassing or abusing an employee, or giving a \"quit or be fired\" ultimatum that the employee accepts by resigning. The employee must resign in response to the change within a reasonable period for the ESA to treat it as a termination. Even a layoff that would otherwise qualify as \"temporary\" under the ESA can amount to constructive dismissal if the employment contract does not permit laying the employee off. Ontario's official guide describes constructive dismissal as \"a complex and difficult subject\" and directs further questions to the Employment Standards Information Centre rather than setting out a bright-line test.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/termination-employment",
    "source_name": "Ontario.ca — Your guide to the Employment Standards Act: Termination of employment (Constructive dismissal)",
    "effective_note": "ESA s.56(1)(b); descriptive only, no dollar or time figures to verify; verified against the live ontario.ca termination-of-employment page on 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "hours_of_work",
    "title": "Ontario hours of work, rest periods and eating periods",
    "content": "Under Ontario's Employment Standards Act, 2000 (Loi de 2000 sur les normes d'emploi), the maximum hours of work (heures de travail) for most employees are 8 hours per day (or the length of an established regular workday longer than 8 hours) and 48 hours per work week. These limits can be exceeded only by written or electronic agreement, and the employer must first give the employee the ministry's information sheet on hours of work and overtime. Employees must receive at least 11 consecutive hours free from work each day, a requirement that cannot be waived by agreement; at least 8 hours off between shifts unless the total time worked on both shifts is 13 hours or less; and either 24 consecutive hours off each work week or 48 consecutive hours off every two consecutive work weeks. An employee may not work more than 5 consecutive hours without a 30-minute eating period (pause-repas), which may be split into two shorter breaks by agreement.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/hours-work",
    "source_name": "Ontario.ca — Your guide to the Employment Standards Act: Hours of work",
    "effective_note": "Verified against the live ontario.ca page on 2026-07-27. Employment Standards Act, 2000, ss. 17–20 (Part VII — hours of work and eating periods). Verified against the consolidated e-Laws ESA text (ontario.ca/laws/statute/00e41) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "layoffs_recall",
    "title": "Ontario — Temporary layoff and recall rules",
    "content": "Under Ontario's Employment Standards Act, 2000, an employee is on temporary layoff (mise à pied temporaire) when an employer cuts back or stops their work without ending the employment relationship; the ESA requires no written notice or reason unless a contract or collective agreement says otherwise. A \"week of layoff\" is one in which the employee earns less than half their usual weekly earnings. A layoff stays \"temporary\" — and is not a termination — if it lasts: not more than 13 weeks in any 20 consecutive weeks; or more than 13 but less than 35 weeks in any 52 consecutive weeks, provided the employer keeps making substantial payments, benefit-plan contributions, or supplementary unemployment benefits, or recalls the employee within an approved or agreed time frame; or, for unionized employees, 35 or more weeks where recall occurs within the collective agreement's time frame. As of November 27, 2025, an employer and non-unionized employee may agree in writing to an extended temporary layoff of 35 or more weeks (up to 52 weeks within 78 consecutive weeks), subject to Director of Employment Standards approval. A layoff exceeding these limits is deemed a termination, generally triggering termination pay.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/termination-employment",
    "source_name": "Ontario.ca — Your guide to the Employment Standards Act: Termination of employment (Temporary lay-off)",
    "effective_note": "ESA s.56(2)-(3.6); extended temporary layoff in effect since November 27, 2025; verified against the live ontario.ca termination-of-employment page on 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "leaves",
    "title": "Ontario ESA job-protected statutory leaves",
    "content": "Ontario's Employment Standards Act, 2000 (Loi de 2000 sur les normes d'emploi) provides job-protected unpaid leaves. Employees with two consecutive weeks' employment are entitled to sick leave (congé de maladie) of up to 3 days per calendar year for illness, injury or medical emergency — employers cannot require a medical note as proof; family responsibility leave (congé pour obligations familiales) of up to 3 days per calendar year for illness, injury, medical emergency or urgent matter concerning specified relatives; and bereavement leave (congé de deuil) of up to 2 days per calendar year on the death of specified family members. Family caregiver leave (congé familial pour les aidants naturels), with no minimum service requirement, allows up to 8 weeks per calendar year for each specified family member with a serious medical condition. Domestic or sexual violence leave (congé en cas de violence familiale ou sexuelle) is available to employees with at least 13 consecutive weeks' employment when the employee or their child experiences, or is threatened with, domestic or sexual violence — up to 10 days and up to 15 weeks per calendar year, the first 5 days paid. Pregnancy leave (congé de maternité) is up to 17 weeks; parental leave (congé parental) is up to 61 weeks for birth mothers who took pregnancy leave, or 63 weeks for other new parents. These ESA leaves are unpaid; income benefits are paid separately under the federal Employment Insurance program.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0",
    "source_name": "Ontario.ca — Your guide to the Employment Standards Act (leaves of absence pages)",
    "effective_note": "Prohibition on employers requiring medical notes for ESA sick leave in effect since October 28, 2024. Two-consecutive-weeks eligibility applies to sick, family responsibility and bereavement leave; family caregiver leave has no minimum length-of-employment requirement. Figures verified against live ontario.ca guide pages on 2026-07-27. Statutory basis: ESA s. 46 (pregnancy), s. 48 (parental), s. 49.3 (family caregiver), s. 49.7 (domestic or sexual violence), s. 50 (sick), s. 50.0.1 (family responsibility), s. 50.0.2 (bereavement). Verified against the consolidated e-Laws ESA text (ontario.ca/laws/statute/00e41) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "minimum_wage",
    "title": "Ontario — General minimum wage rate and effective dates",
    "content": "Ontario's general minimum wage (salaire minimum général) under the Employment Standards Act, 2000 (Loi de 2000 sur les normes d'emploi) is $17.60 per hour from October 1, 2025 to September 30, 2026, and rises to $17.95 per hour from October 1, 2026 to September 30, 2027. Minimum wage rates are indexed annually to the rate of inflation, and a new rate is published on or before April 1 to take effect the following October 1. Special rates for October 1, 2025 to September 30, 2026: student minimum wage (salaire minimum des étudiants) $16.60 per hour; homeworkers minimum wage (salaire minimum des travailleurs à domicile) $19.35 per hour; hunting, fishing and wilderness guides $88.05 per day when working less than five consecutive hours in a day, and $176.15 per day when working five or more hours in a day whether or not the hours are consecutive. Special rates for October 1, 2026 to September 30, 2027: student minimum wage $16.90 per hour; homeworkers minimum wage $19.70 per hour; hunting, fishing and wilderness guides $89.75 per day for less than five consecutive hours, and $179.50 per day for five or more hours. The student rate applies to students under the age of 18 who work 28 hours a week or less when school is in session, or who work during a school break or the summer holidays.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/minimum-wage",
    "source_name": "Ontario.ca — Your guide to the ESA",
    "effective_note": "General rate $17.60/hour to 2026-09-30, then $17.95/hour from 2026-10-01 through 2027-09-30. Special-category rates carried for BOTH periods. Indexed annually to inflation; the next rate is published on or before April 1 2027 for October 1 2027. Verified from ontario.ca EN + FR on 2026-08-04 (two independent fetches); page Date modified 2026-04-01. Employment Standards Act, 2000, s. 23.1 (determination of minimum wage). Verified against the consolidated e-Laws ESA text (ontario.ca/laws/statute/00e41) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "overtime",
    "title": "Ontario — Overtime threshold and rate",
    "content": "Under Ontario's Employment Standards Act, 2000 (Loi de 2000 sur les normes d'emploi), overtime (heures supplémentaires) for most employees — full-time, part-time, students, temporary help agency assignment employees, and casual workers — begins after 44 hours worked in a work week. The overtime rate is 1½ times the employee's regular rate of pay (time and a half; taux majoré de moitié); for example, an employee earning $25.00 per hour receives $37.50 per hour for overtime hours. There is no daily overtime under the ESA: unless an employment contract or collective agreement says otherwise, overtime is calculated only on a weekly basis, or over a longer period under an averaging agreement. With a written averaging agreement, hours may be averaged over periods of 2 to 4 weeks, with overtime payable only when average weekly hours exceed 44; for non-unionized employees such agreements cannot exceed two years.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/overtime-pay",
    "source_name": "Ontario.ca — Your guide to the ESA",
    "effective_note": "Employment Standards Act, 2000, s. 22 (Part VIII — overtime threshold). Verified against the consolidated e-Laws ESA text (ontario.ca/laws/statute/00e41) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "pay_deductions",
    "title": "Ontario — Wage deductions and pay statements",
    "content": "Under Ontario's Employment Standards Act, 2000 (Loi de 2000 sur les normes d'emploi), an employer may deduct from an employee's wages only where a statute of Ontario or Canada requires it (income tax, Employment Insurance premiums, Canada Pension Plan contributions), where a court order authorizes it, or where the employee has given written authorization stating a specific amount or a method of calculating it — an oral or blanket authorization is not sufficient, and the employee may revoke a written authorization for a deduction made for someone else's benefit. Employers must pay all wages earned in a pay period, other than accruing vacation pay, no later than the regular pay day, and must give a wage statement (relevé de paye) on or before pay day setting out the pay period, wage rate, gross wages and how they were calculated, the amount and purpose of each deduction, any room-or-board amounts, and net wages. When employment ends, outstanding wages and vacation pay are due by the later of seven days after the last day worked or the next regular pay day.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/payment-wages",
    "source_name": "Ontario.ca — Your guide to the Employment Standards Act: Payment of wages",
    "effective_note": "ESA ss. 11–13 (payment of wages, wage statements, deductions); verified against the live ontario.ca payment-of-wages page on 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "public_holidays",
    "title": "Ontario public holidays and holiday pay rules",
    "content": "Ontario has nine public holidays (jours fériés) under the Employment Standards Act, 2000 (Loi de 2000 sur les normes d'emploi): New Year's Day, Family Day, Good Friday, Victoria Day, Canada Day, Labour Day, Thanksgiving Day, Christmas Day and Boxing Day (December 26). Most employees are entitled to the day off with public holiday pay (salaire pour jour férié), calculated as all regular wages earned in the four work weeks before the work week containing the holiday, plus all vacation pay payable with respect to those four work weeks, divided by 20. An employee who works on a public holiday is entitled either to regular wages for the hours worked plus a substitute day off with public holiday pay, or to public holiday pay plus premium pay (salaire majoré) of 1.5 times the regular rate for all hours worked, with no substitute day off.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/public-holidays",
    "source_name": "Ontario.ca — Your guide to the Employment Standards Act: Public holidays",
    "effective_note": "Verified against the live ontario.ca page on 2026-07-27. Employment Standards Act, 2000, ss. 24–32 (Part X — public holidays). Verified against the consolidated e-Laws ESA text (ontario.ca/laws/statute/00e41) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "records_retention",
    "title": "Ontario — Employer record-keeping and retention periods",
    "content": "Under Ontario's Employment Standards Act, 2000 (Loi de 2000 sur les normes d'emploi), employers must record and retain specific information for each employee. Name, address and starting date of employment must be kept for three years after the employee stops working for the employer. Dates, times and hours worked each day and week, the information on each wage statement, and copies of excess-hours-of-work or overtime-averaging agreements must each be kept for three years after the relevant work day, week, or the agreement's last day of application. Where an employee has two or more regular pay rates, the dates, times and regular rate for each overtime hour worked must also be kept for three years. Vacation time records must generally be kept for five years after the record was made. The ESA does not prescribe a record format — employers may choose their own — but records must be readily available for inspection by an employment standards officer, even where a bookkeeper or other person retains them on the employer's behalf.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/record-keeping",
    "source_name": "Ontario.ca — Your guide to the Employment Standards Act: Record keeping",
    "effective_note": "ESA Part VI (ss.15–16); three-year general retention, five-year vacation-time record retention; verified against the live ontario.ca record-keeping page on 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "severance",
    "title": "Ontario — Severance pay: a distinct entitlement with qualifying conditions",
    "content": "Ontario has a severance pay entitlement (indemnité de cessation d'emploi) under the Employment Standards Act, 2000 (Loi de 2000 sur les normes d'emploi) that is separate from and in addition to termination notice or termination pay. An employee qualifies only if they have five or more years of employment with the employer AND one of two employer conditions applies: (1) the employer has a global payroll of at least $2.5 million, or (2) the employer severed the employment of 50 or more employees in a six-month period because all or part of the business permanently closed. Severance pay is calculated by multiplying the employee's regular wages for a regular work week by the sum of the completed years of employment plus the completed months in the incomplete final year divided by 12. The maximum severance pay required under the ESA is 26 weeks.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/severance-pay",
    "source_name": "Ontario.ca — Your guide to the ESA",
    "effective_note": "Employment Standards Act, 2000: s. 63 (what constitutes severance), s. 64 (entitlement — 5+ years and payroll or closure conditions), s. 65 (calculating severance pay, 26-week maximum). Verified against the consolidated e-Laws ESA text (ontario.ca/laws/statute/00e41) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "termination_notice",
    "title": "Ontario — Individual termination notice under the Employment Standards Act, 2000",
    "content": "Under Ontario's Employment Standards Act, 2000 (Loi de 2000 sur les normes d'emploi), an employee who has been continuously employed for at least three months is entitled to written notice of termination (préavis de licenciement) or termination pay in lieu (indemnité de licenciement). The notice ladder by period of employment is: less than 1 year — 1 week; 1 year but less than 3 years — 2 weeks; 3 years but less than 4 years — 3 weeks; 4 years but less than 5 years — 4 weeks; 5 years but less than 6 years — 5 weeks; 6 years but less than 7 years — 6 weeks; 7 years but less than 8 years — 7 weeks; 8 years or more — 8 weeks. Termination pay is a lump sum equal to the regular wages for a regular work week the employee would have earned during the notice period, plus vacation pay accruing on it. Separate mass-termination notice periods apply when 50 or more employees are terminated at an establishment within a four-week period: 8 weeks (50–199 employees), 12 weeks (200–499), 16 weeks (500 or more), unless the terminations are 10% or less of employees employed at least 3 months at that location. An employee who has been guilty of wilful misconduct, disobedience or wilful neglect of duty that is not trivial and has not been condoned by the employer is not entitled to notice of termination or termination pay under Part XV (O. Reg. 288/01, s. 2(1)); a dismissal is a termination of employment within the meaning of ESA s. 56.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/termination-employment",
    "source_name": "Ontario.ca — Your guide to the ESA",
    "effective_note": "Employment Standards Act, 2000: s. 54 (written notice required), s. 56 (what constitutes termination), s. 57 (notice ladder), s. 58 (mass-termination notice), s. 61 (pay instead of notice); O. Reg. 288/01 s. 2(1) (exemptions, incl. wilful misconduct) and s. 3 (mass-termination periods, 10% exception). Verified against the consolidated e-Laws ESA text (ontario.ca/laws/statute/00e41) on 2026-09-30 and e-Laws O. Reg. 288/01 (010288).",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "vacation",
    "title": "Ontario — Annual vacation time and vacation pay",
    "content": "Under Ontario's Employment Standards Act, 2000 (Loi de 2000 sur les normes d'emploi), vacation (vacances annuelles) entitlements depend on length of employment. Employees with less than 5 years of employment earn two weeks of vacation time after each 12-month vacation entitlement year, with vacation pay (paie de vacances) of 4 per cent of the gross wages (excluding vacation pay) earned in that entitlement year or stub period. Employees with 5 or more years of employment earn three weeks of vacation time and vacation pay of 6 per cent of gross wages earned in the entitlement year or stub period. A standard vacation entitlement year is a recurring 12-month period beginning on the date of hire; an employer may set an alternative year, creating a prorated stub period first. Vacation time earned must be taken within 10 months after completing the entitlement year or stub period, and the employer must ensure it is scheduled and taken within that window.",
    "source_url": "https://www.ontario.ca/document/your-guide-employment-standards-act-0/vacation",
    "source_name": "Ontario.ca — Your guide to the ESA",
    "effective_note": "Employment Standards Act, 2000, ss. 33–41 (Part XI — vacation with pay). Verified against the consolidated e-Laws ESA text (ontario.ca/laws/statute/00e41) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "ON",
    "topic": "workplace_injury_basics",
    "title": "Ontario — WSIB workplace injury basics: reporting and loss-of-earnings benefits",
    "content": "Ontario workplace injuries and occupational diseases are covered by the Workplace Safety and Insurance Board (WSIB), under the Workplace Safety and Insurance Act. An employer must pay an injured worker their full wages for the day of the injury. If the worker needs treatment beyond first aid, is absent from work, earns less than regular pay, or requires modified work at less than regular pay (or at regular pay for more than seven calendar days), the employer must report the injury or illness to the WSIB within three business days and give the worker a copy of the report; no report is needed if only first aid was given, no time was lost, and pay was unaffected. Workers who lose income due to a workplace injury may receive a loss-of-earnings benefit equal to 85% of net (take-home) average earnings, up to an annual maximum, starting the day after the injury once the worker begins missing time from work, paid every two weeks and reviewed annually for up to six years.",
    "source_url": "https://www.wsib.ca/en/loss-earnings-benefit",
    "source_name": "WSIB Ontario — Report an injury or illness; Loss of earnings benefit",
    "effective_note": "85% loss-of-earnings rate applies to injuries on or after January 1, 1998 (90% applied 1985-1997, 75% before 1985); three-business-day employer reporting window; verified against the live wsib.ca pages on 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "accommodation_basics",
    "title": "Quebec: duty to accommodate under the Charter of Human Rights and Freedoms (CDPDJ)",
    "content": "In Quebec, workplace discrimination and accommodation are governed by the Quebec Charter of Human Rights and Freedoms (Charte des droits et libertés de la personne), not by federal human-rights law for provincially regulated employers. The Charter prohibits discrimination on protected grounds including race, colour, sex, gender identity or expression, pregnancy, sexual orientation, civil status, age, religion, political convictions, language, ethnic or national origin, social condition and handicap. Employers have a duty of reasonable accommodation (obligation d'accommodement raisonnable): they must actively seek solutions — adapting a practice or rule, or granting an exemption — so a person facing discrimination can fully exercise their rights. The duty extends up to undue hardship (contrainte excessive): accommodation may be refused only where the employer objectively demonstrates it would create an excessive financial burden, unduly hinder the organization's operation, or significantly harm safety or the rights of others. The Commission des droits de la personne et des droits de la jeunesse (CDPDJ) administers the Charter, receives complaints about refused accommodation, and provides training and advisory services.",
    "source_url": "https://www.cdpdj.qc.ca/fr/vos-droits/qu-est-ce-que/laccommodement-raisonnable",
    "source_name": "CDPDJ — L'accommodement raisonnable",
    "effective_note": "Descriptive only, no statutory figures; duty, undue-hardship criteria and CDPDJ role verified on the live CDPDJ accommodation page, and the 14 prohibited grounds on the live CDPDJ 'motifs interdits' page, on 2026-07-27.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "constructive_dismissal",
    "title": "Quebec — Constructive dismissal (congédiement déguisé)",
    "content": "Quebec workers employed by the same employer for at least 2 years may file a complaint with the CNESST if they believe they were dismissed without just and sufficient cause (congédiement sans une cause juste et suffisante). Constructive dismissal (congédiement déguisé) is one form of this: a roundabout way for an employer to dismiss a worker by presenting the end of employment as a permanent layoff or ordinary layoff, or by imposing significant and unjustified changes to working conditions — such as a large cut to hours and hourly rate — that effectively force the worker to resign to find equivalent conditions elsewhere. A related concept, \"double sanction,\" arises when an employer disciplines a worker twice for the same misconduct. Not every schedule or duty change qualifies: the CNESST's own guidance gives an example of a modest, business-driven schedule reduction that was found not to be a constructive dismissal because the changes were not significant. A complaint is heard by the Tribunal administratif du travail, which may order reinstatement, lost-wage compensation, or another fair remedy.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/client-services/complaints-recourses/labour-standards-complaints/complaint-concerning-dismissal-without-just-and",
    "source_name": "CNESST — Complaint concerning dismissal without just and sufficient cause",
    "effective_note": "LNT ss.124-135; descriptive only; verified against the live CNESST page on 2026-07-29; CNESST blocks direct HTTP fetching (403), page read via browser.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "hours_of_work",
    "title": "Quebec: standard work week, overtime, meal breaks, weekly rest, and the right to refuse overtime",
    "content": "Under Quebec's Act respecting labour standards, the standard work week (semaine normale de travail) is 40 hours for most workers; hours beyond 40 in a week are overtime paid at time and a half (a 50% increase on the regular rate). Some categories have higher standard weeks, such as 44 hours for security guards at a security firm. After 5 consecutive hours of work, the employer must grant an unpaid 30-minute meal break (période de repas), which must be paid if the worker cannot leave their workstation; other breaks (pauses) are not mandatory but must be paid if granted. Workers are entitled to a weekly rest period (repos hebdomadaire) of at least 32 consecutive hours. A worker may refuse to work more than 2 hours beyond regular daily hours or more than 14 hours per 24-hour period (12 hours for those with flexible or non-continuous schedules), and more than 50 hours in a week (60 in remote areas or the James Bay territory). A worker whose shift is cut short after reporting to work is generally owed 3 hours' pay.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/working-conditions/work-schedule-and-termination-employment/work-schedule",
    "source_name": "CNESST — Work schedule (Horaire de travail / Durée du travail)",
    "effective_note": "Figures verified on live CNESST subpages (standard work week; overtime; time worked, breaks and 3-hour indemnity; right to refuse to work overtime) on 2026-07-27. Act respecting labour standards, s. 52 (standard workweek) and s. 55 (overtime premium). Verified against the consolidated LégisQuébec LNT text (cs/N-1.1) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "layoffs_recall",
    "title": "Quebec — Layoff (mise à pied) and recall rules",
    "content": "Under Quebec's Act respecting labour standards, a layoff (mise à pied) temporarily suspends the employment contract for economic, organizational or technical reasons; the employment relationship is maintained and the worker may be recalled. At the time of a layoff expected to last more than 6 months, the employer must give the worker a written notice of termination of employment (avis de cessation d'emploi) within the delay set by length of continuous service (1 week for 3 months to 1 year; 2 weeks for 1 to 5 years; 4 weeks for 5 to 10 years; 8 weeks for 10 years or more); failing that, the worker is entitled to an indemnity equal to the wages they would have earned during the missing notice period. If a layoff is indefinite or initially expected to last under 6 months but ends up exceeding that period, the employer must pay the indemnity once the 6-month mark is reached; paying it does not itself end the employment relationship. A worker with recall rights of more than 6 months under a collective agreement who was laid off for more than 6 months may claim the indemnity if not recalled, either when their recall rights expire or one year after being laid off.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/working-conditions/termination-employment/termination-layoff-dismissal-and-resignation",
    "source_name": "CNESST — Termination, layoff, dismissal and resignation; Notice of termination of employment and indemnity",
    "effective_note": "LNT ss.82-84; verified against live CNESST pages on 2026-07-29; CNESST blocks direct HTTP fetching (403), pages read via browser.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "leaves",
    "title": "Quebec (LNT/CNESST): job-protected statutory leaves — sick, family/caregiver, bereavement, maternity/paternity/parental",
    "content": "Under Quebec's Act respecting labour standards (Loi sur les normes du travail), administered by the CNESST, an employee may take up to 26 weeks of job-protected absence over 12 months for a non-work-related sickness or accident. An employee may take 10 days per year for family or parental obligations (obligations familiales), including care of a child or acting as an informal caregiver (proche aidant). The first 2 days per calendar year across these absences are paid after 3 months' uninterrupted service. Extended caregiver absence is up to 16 weeks over 12 months for a family member's serious illness or accident, 27 weeks if life-threatening, and 36 weeks for a seriously ill minor child (104 weeks if the child's illness is life-threatening). Bereavement leave (congé de décès) is 5 days — 2 paid — for a spouse, child, spouse's child, parent or sibling, and 1 unpaid day for certain other relatives. Maternity leave (congé de maternité) is 18 consecutive weeks, paternity 5 weeks, and parental up to 65 weeks, all unpaid; income benefits are separate, through the Quebec Parental Insurance Plan (RQAP/QPIP).",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/working-conditions/leave",
    "source_name": "CNESST — Leave (Absences et congés)",
    "effective_note": "Figures verified on live CNESST pages (non-work-related accident or illness; family or parental obligations; death and funeral; adoption or birth) on 2026-07-27; CNESST blocks direct fetching (HTTP 403), pages read via browser. Act respecting labour standards: s. 79.1 (26-week absence, non-work sickness or accident), s. 79.7 (10 days, family obligations), s. 79.8 (16 weeks, caregiver). Verified against the consolidated LégisQuébec LNT text (cs/N-1.1) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "minimum_wage",
    "title": "Quebec — General minimum wage (salaire minimum): $16.60 per hour",
    "content": "Quebec's general minimum wage (salaire minimum) is $16.60 per hour, in effect since May 1, 2026, under the Act respecting labour standards (Loi sur les normes du travail) and its regulation, administered by the CNESST. Workers are entitled to it whether they work full time or part time. A worker may not be paid less than the rate in effect: the employer must pay a wage equal to or higher than the minimum wage even if it provides benefits such as a car or accommodation. Workers paid by the piece or on commission must be paid at least the equivalent of the minimum hourly wage rate for the time worked. The separate minimum wage rate for employees receiving tips (salaire minimum à pourboire) is $13.30 per hour, also in effect since May 1, 2026. When the minimum wage rate increases, the employer is not obliged to adjust a worker's wage that is already higher than the new minimum rate.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/working-conditions/wage-and-pay/wages",
    "source_name": "CNESST — Wages (minimum wage and tipped rates)",
    "effective_note": "General rate of $16.60/hour in effect since May 1, 2026; tipped rate of $13.30/hour also in effect since May 1, 2026, as stated on the CNESST Wages overview page. No upcoming rate change is announced on the page. Act respecting labour standards, s. 40 (minimum wage set by regulation). Verified against the consolidated LégisQuébec LNT text (cs/N-1.1) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "overtime",
    "title": "Quebec — Overtime (heures supplémentaires): 40-hour week, time and a half",
    "content": "Under Quebec's Act respecting labour standards (Loi sur les normes du travail), overtime (heures supplémentaires) is calculated on the basis of the standard work week (semaine normale de travail) of 40 hours for most workers. Hours worked beyond 40 in a week are overtime even if the workplace's usual week is shorter than 40 hours. Overtime must be paid at time and a half — a 50% increase on the regular hourly rate (multiply the usual hourly rate by 1.5). Premiums added to the hourly rate, such as night or evening shift premiums, are not included when calculating overtime. Hours included in annual vacation and statutory general holidays count as hours worked for overtime calculation. At the worker's request, or under a collective agreement or decree, overtime may be replaced by paid leave at time and a half instead of payment. Some categories of workers, such as farm workers, are not eligible for the overtime premium. In certain circumstances a worker may refuse to work overtime.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/working-conditions/wage-and-pay/wages/overtime",
    "source_name": "CNESST — Overtime",
    "effective_note": "Act respecting labour standards, s. 52 (40-hour regular workweek) and s. 55 (50% overtime premium). Verified against the consolidated LégisQuébec LNT text (cs/N-1.1) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "pay_deductions",
    "title": "Quebec — Pay intervals and permitted wage deductions (retenues sur le salaire)",
    "content": "Under Quebec's Act respecting labour standards (Loi sur les normes du travail), administered by the CNESST, an employer has one month to pay a new hire's first wages; after that, wages must be paid at regular intervals of no more than 16 days (or one month for managers). If pay day falls on a statutory holiday, wages must be paid on the preceding working day, except when paid by bank transfer. At each pay, the employer must give the worker a pay slip (bulletin de paye) showing the pay period, hours worked and paid, overtime, bonuses, wage rate, gross wages, the nature and amount of each deduction, and net wages. An employer may deduct from wages only where required by a law, regulation, court order, collective agreement, decree, or a mandatory supplemental pension plan; any other deduction requires the worker's written consent stating its specific purpose, which the worker may revoke at any time — except consent to a mandatory pension or group insurance plan.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/working-conditions/wage-and-pay/pay",
    "source_name": "CNESST — Pay; Pay slip",
    "effective_note": "LNT arts. 43-51 (wage payment, pay slip, permitted deductions); verified against live cnesst.gouv.qc.ca pages on 2026-07-29; CNESST blocks direct HTTP fetching (403), pages read via browser fetch.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "public_holidays",
    "title": "Quebec: 8 paid statutory holidays (jours fériés, chômés et payés) and the pay rule for working one",
    "content": "Quebec workers have 8 paid statutory holidays (jours fériés, chômés et payés) under the Act respecting labour standards and the National Holiday Act (Loi sur la fête nationale): January 1 (New Year's Day); Good Friday or Easter Monday, at the employer's option; National Patriots' Day (the Monday preceding May 25); June 24 (Quebec National Holiday — fête nationale, with special rules); July 1 (Canada Day, or July 2 if July 1 falls on a Sunday); the first Monday in September (Labour Day); the second Monday in October (Thanksgiving); and December 25 (Christmas Day). The holiday indemnity equals 1/20 of the wages earned during the 4 complete weeks of pay preceding the week of the holiday, excluding overtime. A person required to work on a statutory holiday must receive the day's wages plus, at the employer's choice, either the holiday indemnity or a paid compensatory day taken within 3 weeks before or after the holiday (different rules apply to the June 24 National Holiday). Full-time, part-time, temporary, casual and on-call workers are all entitled to statutory holidays.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/working-conditions/leave/statutory-holidays/statutory-holidays",
    "source_name": "CNESST — Statutory holidays in Quebec (Jours fériés)",
    "effective_note": "Verified on the live CNESST statutory-holidays page and the calculating-indemnity subpage (1/20 of 4 complete weeks, overtime excluded; commission-paid workers instead use 1/60 of 12 weeks) on 2026-07-27. Act respecting labour standards, s. 60 (statutory general holidays). Verified against the consolidated LégisQuébec LNT text (cs/N-1.1) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "records_retention",
    "title": "Quebec — Employer payroll record retention (registre de paye)",
    "content": "Under Quebec's Regulation respecting a registration system or the keeping of a register (Règlement sur un système d'enregistrement ou sur la tenue d'un registre), made under the Act respecting labour standards, an employer must keep a registration system or register showing, for each employee, their full name, residence, and social insurance number, their employment, and the date they began working for the employer, along with prescribed particulars for each pay period. The registration system or register for a given year must be kept for a three-year period. Separately, the Act respecting the Québec Pension Plan requires payroll registers and related documents to be kept for at least four years after the last day of the fiscal year in which an employee was terminated, and the Civil Code of Québec's general prescription period means records of terminated employees are commonly retained for at least three years from termination as a litigation safeguard. Group insurance and retirement plan records may carry separate, longer retention obligations under their governing contracts or the Supplemental Pension Plans Act.",
    "source_url": "https://www.legisquebec.gouv.qc.ca/en/document/rc/N-1.1,%20r.%206",
    "source_name": "LégisQuébec — Regulation respecting a registration system or the keeping of a register (N-1.1, r. 6), s.2; CNESST Interpretation Guide",
    "effective_note": "3-year mandatory retention under N-1.1, r.6 s.2, cross-checked against the CNESST interpretation guide's English mirror of the same section; verified 2026-07-29.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "severance",
    "title": "Quebec — No separate statutory severance pay entitlement",
    "content": "Quebec's Act respecting labour standards (Loi sur les normes du travail) does not provide a separate statutory severance pay entitlement distinct from notice of termination. The official CNESST pages on termination of employment (fin d'emploi) set out only the written notice of termination requirement (avis de cessation d'emploi) and, where the required notice is not given, a compensatory indemnity (indemnité compensatrice) equal to the regular wages the employee would have earned during the missing notice period. The CNESST lists the sums due at end of employment as wages, overtime pay, and the vacation indemnity (4% or 6%) — no severance pay appears among them; final amounts must be paid by the regular pay or the next pay, within a maximum of 2 weeks. This differs from jurisdictions such as Ontario and the federal jurisdiction, which have severance pay entitlements in addition to notice. Additional amounts in Quebec would arise only from a contract, a collective agreement, or civil-law reasonable notice (Code civil du Québec), not from the LNT.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/working-conditions/termination-employment/termination-layoff-dismissal-and-resignation",
    "source_name": "CNESST — Termination, layoff, dismissal and resignation",
    "effective_note": "Act respecting labour standards, s. 82 (written notice of termination) and s. 83 (compensatory indemnity). Verified against the consolidated LégisQuébec LNT text (cs/N-1.1) on 2026-09-30.",
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "termination_notice",
    "title": "Quebec — Individual notice of termination of employment (avis de cessation d'emploi)",
    "content": "Under Quebec's Act respecting labour standards (Loi sur les normes du travail, ss. 82–84), administered by the CNESST, an employer must give written notice of termination of employment (avis de cessation d'emploi) when an employee is terminated, dismissed, or laid off for more than 6 months. The notice period depends on uninterrupted service (service continu): 3 months to 1 year of service, 1 week; 1 to 5 years, 2 weeks; 5 to 10 years, 4 weeks; 10 years or more, 8 weeks. No notice is required if the employee has less than 3 months of uninterrupted service, completed the task they were hired for, holds a fixed-term contract, was terminated by force majeure, or was guilty of grave misconduct justifying immediate dismissal. An employer who does not give the required notice must pay an indemnity (indemnité) equal to the regular wages the employee would have earned during the missing notice period, excluding overtime. The annual vacation period may not be counted as part of the notice period, and benefits must be maintained during it.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/working-conditions/termination-employment/notice-termination-employment-and-indemnity",
    "source_name": "CNESST — Notice of termination of employment and indemnity",
    "effective_note": null,
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "vacation",
    "title": "Quebec — Annual vacation (vacances annuelles): duration and 4%/6% indemnity",
    "content": "Under Quebec's Act respecting labour standards (Loi sur les normes du travail, ss. 66–77), annual vacation (vacances annuelles) entitlement is based on uninterrupted service (service continu) at the end of the reference year (année de référence), which in most cases runs May 1 to April 30. Less than 1 year of uninterrupted service: 1 day of vacation per full month of uninterrupted service, up to a maximum of 2 weeks, with a vacation indemnity (indemnité de vacances) of 4% of gross wages earned during the reference year. 1 year to 3 years: 2 consecutive weeks and 4% of gross wages. 3 years: 3 consecutive weeks and 6% of gross wages. From the 4th year onward: 3 consecutive weeks (or more at the employer's discretion) and 6% of gross wages. The threshold for 3 weeks and the 6% indemnity is therefore 3 years of uninterrupted service, not 5. The indemnity must be paid in a lump sum before the vacation starts or with the regular pay covering the vacation period. An employee entitled to 2 weeks may request an additional third week without pay, which the employer must grant.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/working-conditions/leave/annual-vacation",
    "source_name": "CNESST — Annual vacation",
    "effective_note": null,
    "review_status": "machine_curated",
    "status": "active"
  },
  {
    "jurisdiction": "QC",
    "topic": "workplace_injury_basics",
    "title": "Quebec — CNESST workplace injury basics: employer obligations and income replacement",
    "content": "Quebec workplace injuries and occupational diseases are covered by the CNESST under the Act respecting industrial accidents and occupational diseases (Loi sur les accidents du travail et les maladies professionnelles, LATMP). An employer must give first aid immediately after a work accident and pay for the worker's transportation to care if needed. If a worker cannot work for the rest of the day of the accident, the employer must pay 100% of their wages for that day's absence. For an absence of 14 days or less, the employer must pay 90% of the worker's net wages for the days they would normally have worked (excluding the day of the accident) — the income replacement indemnity for the first 14 days — using the Avis de l'employeur et demande de remboursement (ADR) form, and the CNESST reimburses the employer. From the 15th day of incapacity onward, the CNESST pays the income replacement indemnity, equal to 90% of net income, directly to the worker, every two weeks. A worker (or their beneficiary) must file a claim within 6 months of the injury, or within 2 years if the injury resulted from sexual violence.",
    "source_url": "https://www.cnesst.gouv.qc.ca/en/procedures-and-forms/workers/work-accident-or-occupational-disease/what-should-you-do-if-you-have-work-accident",
    "source_name": "CNESST — What should you do if you have a work accident?; Income replacement indemnity",
    "effective_note": "LATMP; 90% net-income indemnity, 14-day employer-paid / CNESST-reimbursed threshold, 6-month (2-year for sexual violence) claim deadline; verified against live CNESST pages on 2026-07-29; CNESST blocks direct HTTP fetching (403), pages read via browser.",
    "review_status": "machine_curated",
    "status": "active"
  }
]
