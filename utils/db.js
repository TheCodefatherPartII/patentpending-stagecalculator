import Sequelize from 'sequelize';

import { logError } from '../utils/log';
import buildStageList from './statusGenerator';

const sq = new Sequelize('codefather', 'codefather', 'codefather', {
  host: 'codefather.cxjadyyca5ie.ap-southeast-2.rds.amazonaws.com',
  dialect: 'postgres',
  logging: false,
});

// fields of interest
const patentFields = [
  'australian_appl_no',
  'exam_request_date',
  'exam_request_filing_date',
  'first_report_issue_date',
  'filing_date',
  'expiry_date',
  'acceptance_published_date',
  'sealing_date',
  'in_force_to_date',
  'patent_status_type',
];
const tmFields = [
  'tm_number',
  'status_code',
  'lodgement_date',
  'sealing_date',
  'renewal_due_date',
];

const toRowValues = ({id, stages}) => `'${id}', '${JSON.stringify(stages)}'`;

// for the array of the current batch, build a bulk insert statement for efficiency
const createBulkInsertSql = (updates, tablename, keyname) => {
  if (updates) {
    // build sql update statement
    return `insert into ${tablename} (${keyname}, metadata) values `+
      updates.map(u => `(${toRowValues(u)})`).join(', ')+
      ';';
  } else {
    return null;
  }
};

// for the array of the current batch, build a bulk update statement for efficiency
const createBulkUpdateSql = (updates, tablename, keyname) => {
  if (updates) {
    // build sql update statement
    return `update ${tablename} set metadata = Q.metadata from (`+
      'SELECT (value->>\'id\')::bigint AS id, (value->>\'metadata\')::json as metadata from json_array_elements(\'['+
      updates.map(u =>`{"id": "${u.id}", "metadata": ${JSON.stringify(u.stages)}}`).join(',') +
      `]\')) Q where ${keyname} = Q.id;`;
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
const updatePatentRecords = (upsert, records) => {
  if (records) {
    return Promise.resolve(buildStageList(records));
  } else {
    const createBulkSql = upsert === 'update' ? createBulkUpdateSql : createBulkInsertSql;
    
    return new Promise(async (resolve, reject) => {
      let count = 0;
      const pageSize = 5000;
      for (let i=0;i<344000;i+=pageSize) {
        const query = `select ${patentFields.join(',')} from patents_ip_australia_process_informations order by australian_appl_no ${i ? `offset ${i} ` : ''}limit ${pageSize}`;
        console.log(`From ${i} to ${i+pageSize} [Running count: ${count}]`);
        try {
          count += await sq.query(query)
            .then(res => buildStageList(res, 'patents_metadata'))
            .then(res => createBulkSql(res, 'patents_metadata', 'autralian_appl_no'))
            .then(applyBulkSql)
        } catch (exc) {
          logError(exc);
        }
      }
      resolve({processed: count});
    });
  }
};

// Derive stage transitions from internal status fields for each record in the main 107 table 
// accepts records for test, otherwise fetches from db
const updateTrademarkRecords = (upsert, records) => {
  if (records) {
    return Promise.resolve(buildStageList(records));
  } else {
    const createBulkSql = upsert === 'update' ? createBulkUpdateSql : createBulkInsertSql;

    return new Promise(async (resolve, reject) => {
      let count = 0;
      const pageSize = 1000;
      for (let i=92000;i<660000;i+=pageSize) {
        const query = `select ${tmFields.join(',')} from trade_marks_trade_mark_informations order by tm_number ${i ? `offset ${i} ` : ''}limit ${pageSize}`;
        console.log(`From ${i} to ${i+pageSize} [Running count: ${count}]`);
        try {
          count += await sq.query(query)
            .then(async res => await buildStageList(res, 'trade_marks_metadata'))
            .then(res => createBulkSql(res, 'trade_marks_metadata', 'tm_number'))
            .then(applyBulkSql)
        } catch (exc) {
          logError(exc);
        }
      }
      resolve({processed: count});
    });
  }
};

export {
  updatePatentRecords,
  updateTrademarkRecords,
};