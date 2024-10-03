import crypto from "crypto";
import jwt from "jsonwebtoken";

// Constants
const LOG_LEVEL = "<% LOG_LEVEL %>";
const JWT_SECRET = "<% JWT_SECRET %>";
const EXPIRE_SEC = parseInt("<% EXPIRE_SEC %>", 10) || 3600;
const SOLUTION_ID = "<% SOLUTION_ID %>";

/**
 * Hashes the password using SHA-256.
 * @param {string} password - The plain text password.
 * @returns {string} The hashed password.
 */
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Generates a JWT token.
 * @param {object} payload - The payload to include in the token.
 * @param {string} secret - The secret key used to sign the token.
 * @param {string} expiresIn - The expiration time of the token.
 * @returns {string} The generated JWT token.
 */
function generateToken({ payload, secret, expiresIn }) {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifies the provided JWT token.
 * @param {string} token - The JWT token to verify.
 * @param {string} secret - The secret key used to sign the token.
 * @returns {{authenticated: boolean, error?: string}} The authentication result.
 */
function verifyToken(token, secret) {
  try {
    const decoded = jwt.verify(token, secret);
    return { authenticated: Date.now() < decoded.exp * 1000 };
  } catch (error) {
    return {
      authenticated: false,
      error: "Authentication error: Invalid token",
    };
  }
}

/**
 * Generate a kvs key.
 * @param {string} username - The username of the user.
 * @returns {string} -  The generated kvs key.
 */
function kvsKey(username) {
  const hash = crypto
    .createHash("sha256")
    .update(`${SOLUTION_ID}-${username}`)
    .digest("base64")
    .substring(4, 12);
  return `${hash}-${SOLUTION_ID}-${username}`;
}

/**
 * Authenticates a user.
 * @param {object} params - The function parameters.
 * @param {string} params.username - The username of the user.
 * @param {string} params.password - The password of the user.
 * @param {object} params.kvs - The key-value store object.
 * @param {object} params.logger - The logger object.
 * @param {string} params.secret - The secret key used to sign the token.
 * @returns {{token: string} | {error: string}} The generated token or an error message.
 */
async function signin({ username, password, kvs, logger, secret }) {
  const key = kvsKey(username);
  const v = await kvs.get({ key });

  if (!v[key] || v[key].value.password !== hashPassword(password)) {
    logger.warn(`Authentication failed for user ${username}`);
    return { error: "Invalid username or password" };
  }

  const token = generateToken({
    payload: { username, role: v[key].value.role },
    secret,
    expiresIn: EXPIRE_SEC,
  });
  logger.debug(`User authenticated successfully`);

  return { token };
}

/**
 * Main function to handle the authentication process.
 * @param {object} data - The input data.
 * @param {object} MODULES - The modules object.
 * @returns {Promise<void>}
 */
export default async function (data, { MODULES }) {
  const { initLogger, kvs, secret: craftSecrets } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await craftSecrets.get({ keys: [JWT_SECRET] });
  const secret = secrets[JWT_SECRET];
  const { req, res } = data;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    logger.debug("Starting the authentication process");

    const { action, username, password } = req.body || {};

    if (!action) {
      logger.warn("Missing action");
      res.status(400).json({ error: "Missing action" });
      return;
    }

    switch (action) {
      case "signin": {
        if (
          !username ||
          !password ||
          typeof username !== "string" ||
          typeof password !== "string"
        ) {
          logger.warn("Invalid 'username' or 'password' parameter");
          res
            .status(400)
            .json({ error: "Invalid 'username' or 'password' parameter" });
          return;
        }
        const { token, error } = await signin({
          username,
          password,
          kvs,
          logger,
          secret,
        });
        if (error) {
          res.status(401).json({ error });
          return;
        }
        res.status(200).json({ token });
        break;
      }

      case "verify": {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
          logger.warn("Missing 'token' parameter");
          res.status(400).json({ error: "Missing 'token' parameter" });
          return;
        }
        const { authenticated, error } = verifyToken(token, secret);
        if (error) {
          res.status(401).json({ error });
          return;
        }
        res.status(200).json({ authenticated });
        break;
      }

      default:
        logger.warn("Invalid 'action' parameter");
        res.status(400).json({ error: "Invalid 'action' parameter" });
    }
  } catch (error) {
    logger.error(`Error in authentication process: ${error.toString()}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
