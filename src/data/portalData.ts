export const PORTAL_DATA = {
  portalName: "CivicPass Citizen Services",
  documentTitle: "Form 104-B: 2030 Civic Health & Tax Rebate Declaration",
  subheading: "Mandatory statutory filing for resident social assistance and medical credit reconciliations.",
  
  // Dense bureaucratic text (WCAG failure: Cognitive barrier, 10th-grade reading level, dense spacing)
  denseLegalText: `Pursuant to Sub-clause 42-A § 88.19(c) of the Revised Civic Allocation Code of 2030, any eligible applicant claiming household healthcare parity credits must comprehensively bifurcate secondary non-deductible taxable stipends against annualized imputed returns prior to filing standard auxiliary deductions. Non-compliance with stipulated verification criteria shall incur retroactive statutory administrative surcharge penalties, automatic disqualification from tier-3 municipal energy vouchers, and irreversible forfeiture of accrued civic credits under Title IV-B. Applicants must cross-index schedule 7-J with municipal docket indices prior to digital signature execution.`,
  
  // AI simplified version (Plain language, readable line-height, bullet points)
  simplifiedSummary: [
    "What this form does: Claims your 2030 healthcare and household rebate money.",
    "What you need: Report all secondary income before choosing standard deductions.",
    "Deadline & Penalties: Submitting late or skipping proof may delay your payout and add a fee.",
    "Next step: Double-check your numbers below, then click 'Submit Verified Rebate'."
  ],

  // Icons without labels
  unlabelledIcons: [
    {
      id: "icon-help",
      iconName: "HelpCircle",
      aiLabel: "Open contextual help guide for Section 42-A deductions",
      aiConfidence: "99.2%",
      originalRole: "button (missing aria-label, missing alt)"
    },
    {
      id: "icon-save",
      iconName: "Save",
      aiLabel: "Save current form progress to local cloud draft",
      aiConfidence: "98.7%",
      originalRole: "button (missing aria-label, missing alt)"
    },
    {
      id: "icon-inspect",
      iconName: "FileSearch",
      aiLabel: "Preview calculation worksheet before final filing",
      aiConfidence: "97.4%",
      originalRole: "button (missing aria-label, missing alt)"
    },
    {
      id: "icon-delete",
      iconName: "Trash2",
      aiLabel: "Clear dependent line item #3 from calculation",
      aiConfidence: "99.5%",
      originalRole: "button (missing aria-label, missing alt)"
    },
    {
      id: "icon-audit",
      iconName: "ShieldAlert",
      aiLabel: "Verify tax integrity signature against public citizen registry",
      aiConfidence: "96.8%",
      originalRole: "button (missing aria-label, missing alt)"
    }
  ]
};
