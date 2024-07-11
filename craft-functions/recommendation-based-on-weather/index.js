// constants
const LOG_LEVEL = '<% LOG_LEVEL %>';
const DATASET_NAME = '<% DATASET_NAME %>';
const AZURE_MAPS_SUBSCRIPTION_KEY = '<% AZURE_MAPS_SUBSCRIPTION_KEY %>';
const AZURE_MAPS_WEATHER_FORECAST_BASE_URL =
  'https://atlas.microsoft.com/weather/forecast/daily/json?api-version=1.0&duration=10&language=ja-JP';
const GOOGLE_MAPS_API_KEY = '<% GOOGLE_API_KEY %>';
const GOOGLE_MAPS_API_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

const ERROR_MESSAGES = {
  MISSING_LOCATION: 'Missing location information',
  INVALID_COORDINATES: 'Invalid location coordinates',
  INVALID_METHOD: 'Invalid method. Must be either searchByGeoLocation or searchByPostal.',
  INVALID_PARAMETERS: 'Invalid parameters for the specified method.',
  NO_RESULTS: 'No results found for the given location',
  FETCH_FAILURE: 'Failed to retrieve information'
};

/**
 * Fetches keys from the key-value store.
 * @param {Object} params - The parameters for fetching keys.
 * @param {Object} params.kvs - The key-value store module.
 * @param {string} params.key - The key to fetch.
 * @returns {Promise<Array<string>>} The dataset keys.
 */
async function fetchKeys({ kvs, key }) {
  const dataset = await kvs.get({ key });
  return dataset[key]?.value.keys || [];
}

/**
 * Fetches products based on the provided keys from the key-value store.
 * @param {Object} params - The parameters for fetching the products.
 * @param {Object} params.kvs - The key-value store module.
 * @param {Array<string>} params.keys - The product keys to fetch.
 * @returns {Promise<Array<Object>>} The products.
 */
async function fetchProducts({ kvs, keys }) {
  const products = await Promise.all(
    keys.map(async key => {
      const product = await kvs.get({ key });
      return product[key]?.value || null;
    })
  );
  return products.filter(product => !!product);
}

/**
 * Filters products based on temperature and product ID.
 * @param {Object} params - The parameters for filtering the products.
 * @param {Array<Object>} params.products - The list of products to filter.
 * @param {number} [params.temp] - The temperature to filter by.
 * @param {string} [params.pid] - The product ID to filter by.
 * @returns {Array<Object>} The filtered products.
 */
function filterProducts({ products, temp, pid }) {
  let filteredProducts = products;

  if (temp !== undefined) {
    const tempNumber = parseFloat(temp);
    filteredProducts = filteredProducts.filter(
      product =>
        product.shouldRecommendAbove <= tempNumber && tempNumber < product.shouldRecommendBelow
    );
  }

  if (pid !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.id === pid);
  }

  return filteredProducts;
}

/**
 * Retrieves weather information for the specified location.
 * @param {Object} params - The parameters for retrieving weather information.
 * @param {number} params.lat - The latitude of the location.
 * @param {number} params.lon - The longitude of the location.
 * @param {string} params.apiKey - The Azure Maps API key.
 * @param {Object} params.logger - The logger object.
 * @returns {Promise<Object>} The weather information.
 * @throws {Error} If the weather information retrieval fails.
 */
async function getWeatherInfo({ lat, lon, apiKey, logger }) {
  const url = `${AZURE_MAPS_WEATHER_FORECAST_BASE_URL}&subscription-key=${apiKey}&query=${lat},${lon}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.FETCH_FAILURE);
  }
  const data = await response.json();
  logger.debug(`Data fetched successfully from ${url}`);
  return data;
}

/**
 * Validates the location information from the query parameters.
 * @param {Object} params - The parameters for validating the location.
 * @param {Object} params.query - The query parameters.
 * @param {Object} params.logger - The logger object.
 * @returns {Object} The validated location information.
 * @throws {Error} If the location information is missing or invalid.
 */
function validateLocation({ query, logger }) {
  const { x, y } = query;

  if (!x || !y) {
    logger.warn(ERROR_MESSAGES.MISSING_LOCATION);
    throw new Error(ERROR_MESSAGES.MISSING_LOCATION);
  }

  return { x, y };
}

/**
 * Parses the location information.
 * @param {Object} params - The parameters for parsing the location.
 * @param {string} params.x - The longitude.
 * @param {string} params.y - The latitude.
 * @param {Object} params.logger - The logger object.
 * @returns {Object} The parsed location information.
 * @throws {Error} If the location coordinates are invalid.
 */
function parseLocation({ x, y, logger }) {
  const lat = parseFloat(y);
  const lon = parseFloat(x);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    logger.warn(ERROR_MESSAGES.INVALID_COORDINATES);
    throw new Error(ERROR_MESSAGES.INVALID_COORDINATES);
  }

  return { lat, lon };
}

/**
 * Fetches data from the given URL.
 * @param {Object} params - The parameters for fetching data.
 * @param {string} params.url - The URL to fetch data from.
 * @param {Object} params.logger - The logger object.
 * @returns {Promise<Object>} The fetched data.
 * @throws {Error} If the data fetch fails.
 */
async function fetchData({ url, logger }) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.FETCH_FAILURE);
    }
    const data = await response.json();
    logger.debug(`Data fetched successfully from ${url}`);
    return data;
  } catch (error) {
    logger.error(`Error fetching data from ${url}: ${error.message}`);
    throw error;
  }
}

/**
 * Builds the Google Maps API URL for geolocation or postal search.
 * @param {Object} params - The parameters for building the URL.
 * @param {string} params.method - The method to use ('searchByGeoLocation' or 'searchByPostal').
 * @param {string} params.x - The longitude.
 * @param {string} params.y - The latitude.
 * @param {string} params.postal - The postal code.
 * @param {string} params.apiKey - The Google Maps API key.
 * @returns {string} The constructed URL.
 * @throws {Error} If the method or parameters are invalid.
 * 
 * Note: The 'searchByPostal' method is not currently used in the Sites template.
 * It is included here as a reference implementation for potential future use
 * or for projects that might require postal code-based geolocation.
 */
function buildGeoLocationUrl({ method, x, y, postal, apiKey }) {
  if (method === 'searchByGeoLocation' && x && y) {
    return `${GOOGLE_MAPS_API_BASE_URL}?latlng=${y},${x}&language=ja&key=${apiKey}`;
  }
  
  // The following block is for potential future use or reference
  if (method === 'searchByPostal' && postal) {
    return `${GOOGLE_MAPS_API_BASE_URL}?address=${postal}&language=ja&key=${apiKey}`;
  }
  throw new Error(ERROR_MESSAGES.INVALID_PARAMETERS);
}

/**
 * Retrieves geolocation information based on the specified method and parameters.
 * @param {Object} params - The parameters for retrieving geolocation information.
 * @param {string} params.method - The method to use ('searchByGeoLocation' or 'searchByPostal').
 * @param {string} params.x - The longitude.
 * @param {string} params.y - The latitude.
 * @param {string} params.postal - The postal code.
 * @param {Object} params.logger - The logger object.
 * @param {string} params.apiKey - The Google Maps API key.
 * @returns {Promise<Object>} The geolocation information.
 * @throws {Error} If the geolocation information retrieval fails.
 */
async function getGeoLocationInfo({ method, x, y, postal, logger, apiKey }) {
  const url = buildGeoLocationUrl({ method, x, y, postal, apiKey });
  return fetchData({ url, logger });
}

/**
 * Extracts a specific address component from the address components array.
 * @param {Object} params - The parameters for extracting the address component.
 * @param {Array<Object>} params.addressComponents - The address components array.
 * @param {string} params.type - The type of address component to extract.
 * @returns {string} The extracted address component.
 */
function extractAddressComponent({ addressComponents, type }) {
  return addressComponents.find(component => component.types.includes(type))?.long_name || '';
}

/**
 * Builds the response data from the geolocation information.
 * @param {Object} params - The parameters for building the response data.
 * @param {Object} params.geoLocationInfo - The geolocation information.
 * @param {string} params.postal - The postal code.
 * @returns {Object} The response data.
 * @throws {Error} If no results are found for the given location.
 */
function buildResponseData({ geoLocationInfo, postal }) {
  if (!geoLocationInfo.results || geoLocationInfo.results.length === 0) {
    throw new Error(ERROR_MESSAGES.NO_RESULTS);
  }

  const result = geoLocationInfo.results[0];
  const addressComponents = result.address_components;
  const geometry = result.geometry;

  return {
    city: extractAddressComponent({ addressComponents, type: 'locality' }),
    city_kana: '',
    town: extractAddressComponent({ addressComponents, type: 'sublocality_level_1' }),
    town_kana: '',
    x: geometry.location.lng.toString(),
    y: geometry.location.lat.toString(),
    distance: 0,
    prefecture: extractAddressComponent({ addressComponents, type: 'administrative_area_level_1' }),
    postal: postal || '',
  };
}

/**
 * Main function to handle the request.
 * @param {Object} data - The request data.
 * @param {Object} MODULES - The modules object containing logger and key-value store.
 */
export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { initLogger, kvs, secret: craftSecrets } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { route } = req.query;

  try {
    switch (route) {
      case 'locationWeather': {
        if (req.method !== 'GET') {
          res.status(405).send('Method Not Allowed');
          return;
        }

        const { x, y } = validateLocation({ query: req.query, logger });
        const { lat, lon } = parseLocation({ x, y, logger });

        // Get geolocation information using Google Maps API
        const geoSecrets = await craftSecrets.get({ keys: [GOOGLE_MAPS_API_KEY] });
        const geoApiKey = geoSecrets[GOOGLE_MAPS_API_KEY];
        const geoLocationInfo = await getGeoLocationInfo({ method: 'searchByGeoLocation', x, y, logger, apiKey: geoApiKey });
        const locationData = buildResponseData({ geoLocationInfo, postal: '' });

        // Get weather information using Azure Maps API
        const weatherSecrets = await craftSecrets.get({ keys: [AZURE_MAPS_SUBSCRIPTION_KEY] });
        const weatherApiKey = weatherSecrets[AZURE_MAPS_SUBSCRIPTION_KEY];
        const weatherInfo = await getWeatherInfo({ lat, lon, apiKey: weatherApiKey, logger });

        // Combine location and weather information
        res.status(200).json({
          location: locationData,
          weather: weatherInfo
        });
        break;
      }

      case 'products': {
        if (req.method !== 'GET') {
          res.status(405).send('Method Not Allowed');
          return;
        }

        const keys = await fetchKeys({ kvs, key: DATASET_NAME });
        const products = await fetchProducts({ kvs, keys });

        const { temp, pid } = req.query;
        logger.log({ temp, pid });

        const filteredProducts = filterProducts({ products, temp, pid });

        if (filteredProducts.length > 0) {
          res.status(200).json(filteredProducts);
        } else {
          res.status(404).json({ error: 'Product not found' });
        }
        break;
      }

      default:
        res.status(404).send('Not Found');
        break;
    }
  } catch (error) {
    logger.error(`Error handling request: ${error.message}`);
    if (Object.values(ERROR_MESSAGES).includes(error.message)) {
      if (error.message === ERROR_MESSAGES.NO_RESULTS) {
        res.status(404).send(error.message);
      } else if (error.message === ERROR_MESSAGES.FETCH_FAILURE) {
        res.status(500).send(error.message);
      } else {
        res.status(400).send(error.message);
      }
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
}