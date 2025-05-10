const {sign} = require("jsonwebtoken");
const qs = require('qs');
const crypto = require("crypto");

/**
 * Create a signed JWT token
 */
async function createJWTToken(httpMethod, key_name, key_secret, uri) {
    const algorithm = 'ES256';
    const methodUri = httpMethod + ' ' + uri;
    return sign(
        {
            iss: 'cdp',
            nbf: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 120,
            sub: key_name,
            uri: methodUri,
        },
        key_secret,
        {
            algorithm,
            header: {
                kid: key_name,
                nonce: crypto.randomBytes(16).toString('hex'),
            },
        }
    );
}

/**
 * Fetch API credentials from .env
 */
async function getAPIAuthentication() {
    const keyId = process.env.COINBASE_API_KEY;
    const base64Secret = process.env.COINBASE_API_SECRET;

    if (!keyId || !base64Secret) {
        throw new Error("Missing COINBASE_API_KEY or COINBASE_API_SECRET in environment.");
    }

    return { key: keyId, secret: base64Secret };
}

/**
 * Constructs a configuration object for making HTTP requests with Axios.
 * @param {string} uri - The URI of the API endpoint.
 * @param {string} httpMethod - The HTTP method.
 * @param {Object} queryParametersDict - An object containing query parameters.
 * @returns {Object} The configuration object for Axios.
 */
async function generateApiConfiguration(uri, httpMethod, queryParametersDict = null) {
    const apiAuth = await getAPIAuthentication();
    const token = await createJWTToken(httpMethod, apiAuth.key, apiAuth.secret, uri);
    let fullUri = `https://${uri}`;

    if (queryParametersDict) {
        const queryString = qs.stringify(queryParametersDict);
        fullUri += "?" + queryString;
    }

    return {
        method: httpMethod,
        url: fullUri,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    };
}

module.exports = {createJWTToken, getAPIAuthentication, generateApiConfiguration}