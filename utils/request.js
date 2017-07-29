function extractRequest(event) {
  const {httpMethod: method, body, path, queryStringParameters: params} = event; 
  
  return {
    params,
    method,
    body: JSON.parse(body),
    path,
  }
}

export default extractRequest;
