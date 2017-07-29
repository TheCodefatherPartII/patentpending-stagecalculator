import Sequelize from 'sequelize';

import { logError } from '../utils/log';
import buildStageList from './statusGenerator';

const sq = new Sequelize('codefather', 'codefather', 'codefather', {
  host: 'codefather.cxjadyyca5ie.ap-southeast-2.rds.amazonaws.com',
  dialect: 'postgres',
  logging: false,
});

// fields of interest
const fields = [
  'australian_appl_no',
  'pct_application_ind',
  'exam_request_date',
  'exam_request_filing_date',
  'requested_exam_type',
  'exam_status_type',
  'deferement_request_date',
  'first_report_issue_date',
  'further_report_issue_date',
  'examination_section_name',
  'acceptance_postponed_ind',
  'search_results_received_date',
  'thrd_prty_exam_request_date',
  'filing_date',
  'opi_date',
  'npe_date',
  'expiry_date',
  'earliest_priority_date',
  'acceptance_published_date',
  'sealing_date',
  'wipo_publication_date',
  'effective_patent_date',
  'opi_published_in_journal_date',
  'continue_renew_fee_paid_date',
  'in_force_to_date',
  'accepted_claims_count',
  'patent_status_type',
  'application_date',
];

const toRowValues = ({id, stages}) => `'${id}', '${JSON.stringify({stages})}'`;

// for the array of the current batch, build a bulk insert statement for efficiency
const createBulkInsertSql = (updates) => {
  if (updates) {
    // build sql update statement
    return 'insert into patents_metadata (australian_appl_no, metadata) values '+
      updates.map(u => `(${toRowValues(u)})`).join(', ')+
      ';';
  } else {
    return null;
  }
};

// for the array of the current batch, build a bulk update statement for efficiency
const createBulkUpdateSql = (updates) => {
  if (updates) {
    // build sql update statement
    return 'update patents_metadata set metadata = Q.metadata from ('+
      'SELECT (value->>\'id\')::bigint AS id, (value->>\'metadata\')::json as metadata from json_array_elements(\'['+
      updates.map(u =>`{"id": "${u.id}", "metadata": ${JSON.stringify(u.stages)}}`).join(',') +
      ']\')) Q where australian_appl_no = Q.id;';
  } else {
    return null;
  }
};

// actually perform the bulk insert
const applyBulkSql = async (sql) => {
  if (!sql) return null
  
  return await new Promise((resolve) => {
    try {
      sq.query(sql)
        .spread((records, metadata) => {
          resolve(metadata.rowCount || metadata);
        });
    } catch (exc) {
      logError(exc);
    }
  });
};

// Derive stage transitions from internal status fields for each record in the main 107 table 
// accepts records for test, otherwise fetches from db
const updateDbRecords = (upsert, records) => {
  if (records) {
    return Promise.resolve(buildStageList(records));
  } else {
    const createBulkSql = upsert === 'update' ? createBulkUpdateSql : createBulkInsertSql;
    
    return new Promise(async (resolve, reject) => {
      let count = 0;
      const pageSize = 5000;
      for (let i=0;i<344000;i+=pageSize) {
        const query = `select ${fields.join(',')} from patents_ip_australia_process_informations order by australian_appl_no ${i ? `offset ${i} ` : ''}limit ${pageSize}`;
        console.log(`From ${i} to ${i+pageSize} [Running count: ${count}]`);
        try {
          count += await sq.query(query)
            .then(buildStageList)
            .then(createBulkSql)
            .then(applyBulkSql)
        } catch (exc) {
          logError(exc);
        }
      }
      resolve({processed: count});
    });
  }
};

export default updateDbRecords;