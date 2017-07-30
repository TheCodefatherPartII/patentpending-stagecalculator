import { updateTrademarkRecords } from '../utils/db';
import extractRequest from '../utils/request';

export default function calculateTrademarkState(event, context, callback) {
  const req = extractRequest(event);
  const upsert = req.method === 'PUT' ? 'update' : 'insert';
  console.log("Running state calculations for", upsert);
  // updateDbRecords(upsert, [testData])
  updateTrademarkRecords(upsert)
    .then(results => {
      console.log('Main results:', results);
      return callback(null, {statusCode: 200, body: JSON.stringify(results)})
    })
    .catch(err => callback('Error:', err));
}