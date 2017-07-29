import moment from 'moment';
const now = moment();

// util to handle odd date format and convert to moment object
const dateOrNull = (date) => {
  date = date === '9999-12-31' ? null : date; 
  return date ? moment(date) : null
};

// util to handle null-y date to string
const formatDate = (date) => date ? date.format('YYYY-MM-DD') : null;

// util to build stage details based on start and end dates
const calculateStage = (stageName, date, nextDate) => {
  const estimate = date ? date.clone().add(Math.random() * 15, 'd') : null;
  return {
    stageName,
    finished: !!nextDate,
    dateStarted: formatDate(date),
    dateFinished: formatDate(nextDate),
    estimatedDateOfFinish: formatDate(nextDate ? null : estimate),
  };
};

// for each fixed stage, calculate the resulting payload
const calculateStages = (row) => {
  const id = row.australian_appl_no;
  const filedDate = dateOrNull(row.filing_date);
  const examStartDate = dateOrNull(row.exam_request_date);
  const examInProgressDate = dateOrNull(row.first_report_issue_date);
  const acceptedDate = dateOrNull(row.acceptance_published_date);
  const completedDate = dateOrNull(row.sealing_date);
  const expiryDate = dateOrNull(row.in_force_to);
  const terminationDate = dateOrNull(row.expiry_date);
  
  return {
    id,
    stages: [
      calculateStage('filed', filedDate, examStartDate),
      calculateStage('waitingForExamination', examStartDate, examInProgressDate),
      calculateStage('beingExamined', examInProgressDate, acceptedDate),
      calculateStage('acceptanceAndOppositionPhase', acceptedDate, completedDate),
      calculateStage('registered', completedDate, expiryDate),
      calculateStage('expired', expiryDate, (terminationDate && terminationDate.isAfter(now)) ? terminationDate : null),
    ]
  };
};

// calculate stage information for each row
const processRows = (rows) => {
  return rows && rows[0].map(row => calculateStages(row)) || [];
};

export default processRows;