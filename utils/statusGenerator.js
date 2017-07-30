import moment from 'moment';
// import statusMap from '../utils/trademarkStatusCodes';
import request from 'superagent';

const now = moment();

// util to handle odd date format and convert to moment object
const dateOrNull = (date) => {
  date = date === '9999-12-31' ? null : date; 
  return date ? moment(date) : null
};

// util to handle null-y date to string
const formatDate = (date) => date ? date.format('YYYY-MM-DD') : null;

const calculateEstimate = (stageName, date) => date ? date.clone().add(Math.random() * 15, 'd') : null;

// util to build stage details based on start and end dates
const calculateStage = (stageName, date, nextDate, completed) => {
  // TODO: actual estimates from average of durations/ML
  return {
    stageName,
    finished: completed || !!nextDate,
    dateStarted: formatDate(date),
    dateFinished: formatDate(nextDate),
    estimatedDateOfFinish: formatDate(nextDate ? null : calculateEstimate(stageName, date)),
  };
};

const calculatePatentStages = (row) => {
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

const stageMap = {
  'FILED': () => 'filed',
  'EXAMINATION': (label) => ['Examined', 'Being Examined'].includes(label) ? 'beingExamined' : 'waitingForExamination',
  'ACCEPTANCE_OPPOSITION': () => 'acceptanceAndOppositionPhase',
  'REGISTERED': (label) => label === 'Registered' ? 'registered' : 'expired',
};

const findStartDateForStage = (stage, dates, dbDates) => {
  switch (stage) {
    case 'filed': return dates['Lodgement'];
    case 'waitingForExamination': return null;
    case 'beingExamined': return dates['First report'];
    case 'acceptanceAndOppositionPhase': return dates['Acceptance advertised'];
    case 'registered': return dbDates.completedDate;
    case 'expired': return dbDates.expiryDate;
    default: return null;
  }
};

const calculateTrademarkStages = async (row) => {
  const status = row.status_code;
  const id = row.tm_number;
  
  const lodgementDate = dateOrNull(row.lodgement_date);
  const completedDate = dateOrNull(row.sealing_date);
  const expiryDate = dateOrNull(row.renewal_due_date);

  try {
    const stages = await request.get(`https://search.ipaustralia.gov.au/trademarks/search/view/${id}/status`)
    .then(({body}) => body)
    .then(({stages}) => {
      return stages.map(({stage: {stage, completed, label}, dates}) => {
        const stageName = stageMap[stage](label);
        const startDate = dateOrNull(findStartDateForStage(stageName, dates, {completedDate, expiryDate}));
        return {
          stageName,
          finished: completed,
          dateStarted: startDate,
          dateFinished: null,
          estimatedDateOfFinish: calculateEstimate(stageName, startDate),
        }
      });
    })
    .then(stages => {
      return stages.map((data, i) => {
        const nextStage = (i < stages.length-1) ? stages[i+1] : null;
        data.dateFinished = nextStage ? nextStage.dateStarted : null;
        return data;
      });
    });
    
    if (!stages.find(s => s.stageName === 'waitingForExamination')) {
      stages.splice(1, 0, {
        stageName: 'waitingForExamination',
        finished: true,
        dateStarted: lodgementDate,
        dateFinished: stages[1].dateStarted,
        estimatedDateOfFinish: null,
      })
    }
    
    const registeredStage = stages[stages.length-1];
    registeredStage.completed = !!(expiryDate && expiryDate.isBefore(now));
    registeredStage.dateFinished = registeredStage.completed ? expiryDate : null;
    
    stages.push({
      stageName: 'expired',
      finished: false,
      dateStarted: expiryDate,
      dateFinished: null,
      estimatedDateOfFinish: null,
    });
    
    return {
      id,
      stages,
    };
  } catch (exc) {
    console.log(exc);
    if (exc.code === 'ECONNRESET') {
      return await calculateTrademarkStages(row);
    }
    throw new Error('Failed to get find trademark status');
  }
};

// calculate stage information for each row
const processRows = (rows, tablename) => {
  return new Promise(async (resolve, reject) => {
    const results = await Promise.all(rows && rows[0].map(row => (
      tablename === 'patents_metadata' ? Promise.resolve(calculatePatentStages(row)) : calculateTrademarkStages(row)
    )) || []);
    console.log('Completed state calcs:',results.length,'results', results[0]);
    resolve(results);
  })
};

export default processRows;