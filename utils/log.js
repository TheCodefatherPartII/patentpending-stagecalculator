
const logError = (exc) => {
  const {name, errors, fields, message} = exc;
  console.log({name, errors, fields, message});
  console.log('=================================');
};

export {
  logError,
}