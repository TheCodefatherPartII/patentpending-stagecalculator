
const headers = [
  'australian_appl_no',
  'source_data_key_code',
  'patent_type',
  'pct_application_ind',
  'requested_exam_type',
  'exam_status_type',
  'examination_section_name',
  'acceptance_postponed_ind',
  'accepted_claims_count',
  'patent_status_type',
  'application_date',
  'npe_date',
  'filing_date',
  'opi_date',
  'expiry_date',
  'search_completed_date',
  'exam_request_date',
  'exam_request_filing_date',
  'deferement_request_date',
  'first_report_issue_date',
  'further_report_issue_date',
  'search_results_received_date',
  'thrd_prty_exam_request_date',
  'earliest_priority_date',
  'acceptance_published_date',
  'sealing_date',
  'wipo_publication_date',
  'effective_patent_date',
  'opi_published_in_journal_date',
  'continue_renew_fee_paid_date',
  'in_force_to_date'
];

const raw = [
  ['1962018599', 'C', 'Standard', 'No', null, null, null, null, null, null, '2011-11-18', '9999-12-31', '2011-11-18', '1964-12-03', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31'],
  ['2016905399', 'PAMS', 'Provisional', 'No', null, null, null, null, null, 'FILED', '2016-12-31', '9999-12-31', '2016-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31', '9999-12-31'],
];

const rows = raw.map(r => {
    return headers.reduce((agg, c, i) => {
      agg[c] = r[i];
      return agg;
    }, {});
  }
);

export const testData = rows;