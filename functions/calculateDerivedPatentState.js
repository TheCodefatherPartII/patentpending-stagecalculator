// import extractRequest from '../utils/request';
// import buildResponse from '../utils/response';
import { updatePatentRecords } from '../utils/db';
import { testData } from '../utils/testdata';
import extractRequest from '../utils/request';

export default function calculatePatentState(event, context, callback) {
  const req = extractRequest(event);
  const upsert = req.method === 'PUT' ? 'update' : 'insert';
  console.log("Running state calculations for", upsert);
  // updateDbRecords(upsert, [testData])
  updatePatentRecords(upsert)
    .then(results => {
      console.log('Main results:', results);
      return callback(null, {statusCode: 200, body: JSON.stringify(results)})
    })
    .catch(err => callback('Error:', err));
}