import api from 'api';
import { parse } from 'csv-parse';

const LOG_LEVEL = 'DEBUG';
const KARTE_API_TOKEN_SECRET = '<%KARTE_API_TOKEN_SECRET%>';
const CSV_PARSE_OPTIONS = {
  columns: true,
  skip_empty_lines: true,
};
const VALIDATION_RULES = {
  campaignData: {
    isNonEmpty: {
      check: data => Object.keys(data).length > 0,
      message: 'campaignData is empty',
      level: 'error',
    },
  },
  actionData: {
    hasTemplateId: {
      check: data => data.template_id && data.template_id !== '',
      message: 'template_id is empty or missing',
      level: 'error',
    },
    hasNonEmptyQuery: {
      check: data => data.query && Object.keys(data.query).length > 0,
      message: 'query is empty or missing',
      level: 'error',
    },
    hasCorrectStructure: {
      check: data => Object.keys(data).length === 2,
      message: 'actionData has invalid structure',
      level: 'warning',
    },
  },
};

const sdk = api('@dev-karte/v1.0#7djuwulvxfdhn1');

function parseQueryResultStr(queryResultStr, logger) {
  return new Promise((resolve, reject) => {
    parse(queryResultStr, CSV_PARSE_OPTIONS, (err, records) => {
      if (err) {
        logger.error('Parsing Error:', err);
        reject(err);
      } else {
        resolve(records);
      }
    });
  });
}

function parseJsonField(field, logger) {
  try {
    if (field === 'null' || field === ' ') {
      throw new Error(`Invalid field value detected: '${field}'`);
    } else {
      return JSON.parse(field);
    }
  } catch (e) {
    logger.error(`Error parsing JSON field: ${field}`, e);
    throw new Error(`Failed to parse JSON field: ${field}`);
  }
}

function toNumber(field) {
  return field !== '' ? Number(field) : undefined;
}

function addIfPresent(target, source, key, parseFn) {
  if (source[key]) {
    target[key] = parseFn ? parseFn(source[key]) : source[key];
  }
}

function mapCampaignData(item, logger) {
  const result = {};

  addIfPresent(result, item, 'title');
  addIfPresent(result, item, 'enabled', field => parseJsonField(field, logger));
  addIfPresent(result, item, 'description');
  addIfPresent(result, item, 'segments_details', field => parseJsonField(field, logger));
  addIfPresent(result, item, 'start_date', field => new Date(field.replace(' ', 'T')));
  addIfPresent(result, item, 'end_date', field => new Date(field.replace(' ', 'T')));
  addIfPresent(result, item, 'dist_days_and_hours', field => parseJsonField(field, logger));
  addIfPresent(result, item, 'max_number_of_display', toNumber);
  addIfPresent(result, item, 'max_number_of_display_per_day', toNumber);
  addIfPresent(result, item, 'max_number_of_close', toNumber);
  addIfPresent(result, item, 'max_number_of_close_per_day', toNumber);
  addIfPresent(result, item, 'max_number_of_click', toNumber);
  addIfPresent(result, item, 'max_number_of_click_per_day', toNumber);
  addIfPresent(result, item, 'goal', field => parseJsonField(field, logger));
  addIfPresent(result, item, 'dimension_optimisation', field => parseJsonField(field, logger));
  addIfPresent(result, item, 'trigger', field => parseJsonField(field, logger));
  addIfPresent(result, item, 'user_type');
  addIfPresent(result, item, 'is_archived', field => parseJsonField(field, logger));

  return result;
}

function mapActionData(item, logger) {
  const result = {};

  addIfPresent(result, item, 'template_id');
  addIfPresent(result, item, 'query', field => parseJsonField(field, logger));

  return result;
}

function validateData(result, logger) {
  const validationReport = result.map((record, index) => {
    const recordReport = { index: index + 1, errors: [], warnings: [] };

    Object.entries(VALIDATION_RULES).forEach(([dataKey, rules]) => {
      Object.values(rules).forEach(rule => {
        if (!rule.check(record[dataKey])) {
          const message = `Record ${index + 1}: ${rule.message}`;
          if (rule.level === 'error') {
            recordReport.errors.push(message);
            logger.error(message);
          } else {
            recordReport.warnings.push(message);
            logger.warn(message);
          }
        }
      });
    });

    return recordReport;
  });

  const hasErrors = validationReport.some(report => report.errors.length > 0);
  const hasWarnings = validationReport.some(report => report.warnings.length > 0);

  return {
    isValid: !hasErrors,
    hasWarnings,
    details: validationReport,
  };
}

function processData(records, logger) {
  logger.debug('Processing Records');

  try {
    const result = records.map(item => ({
      campaignData: mapCampaignData(item, logger),
      actionData: mapActionData(item, logger),
    }));

    const validationResult = validateData(result, logger);
    const isValid = validationResult.isValid && !validationResult.hasWarnings;

    if (!isValid) {
      logger.error('Invalid data detected. Check logs for details.');
      throw new Error('Campaign data or action data is invalid. Terminating process.');
    }

    return result;
  } catch (error) {
    logger.error('Processing error:', error);
    return null;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({
    keys: [KARTE_API_TOKEN_SECRET],
  });
  const token = secrets[KARTE_API_TOKEN_SECRET];

  sdk.auth(token);

  const queryResultStr = data.jsonPayload.data.value;

  try {
    const records = await parseQueryResultStr(queryResultStr, logger);
    const processedData = processData(records, logger);

    await Promise.all(
      processedData.map(async item => {
        const nc = await sdk.postV2betaActionCampaignCreate({
          campaign: item.campaignData,
        });

        const newCampaign = nc.data.campaign;

        logger.debug(`Campaign Id: ${newCampaign.id}\nCampaign created successfully`);

        await sdk.postV2betaActionActionCreate({
          campaign_id: newCampaign.id,
          template_id: item.actionData.template_id,
          query: item.actionData.query,
        });
        logger.debug(`Campaign Id: ${newCampaign.id}\nAction created successfully`);
      })
    );
  } catch (error) {
    logger.error({ error });
  }
}
