export default function buildResponse(status, payload) {
  if (!payload) { // one param call is equivalent to  response(200, payload)
    payload = status;
    status = 200;
  }
  
  return {statusCode: status, body: JSON.stringify(payload)};
}