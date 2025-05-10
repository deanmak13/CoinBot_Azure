const CoinbaseBaseURL = 'api.coinbase.com';

class RequestPath{
    static ACCOUNTS = '/api/v3/brokerage/accounts';
    static PRODUCTS = '/api/v3/brokerage/products';
}

class HttpMethod{
    static GET = "GET";
}

function resolveIntToApiGranularity(minutes) {
    if (minutes <= 1) return "ONE_MINUTE";
    if (minutes <= 5) return "FIVE_MINUTE";
    if (minutes <= 15) return "FIFTEEN_MINUTE";
    if (minutes <= 30) return "THIRTY_MINUTE";
    if (minutes <= 60) return "ONE_HOUR";
    if (minutes <= 120) return "TWO_HOUR";
    if (minutes <= 240) return "THREE_HOUR";
    if (minutes <= 360) return "SIX_HOUR";
    return "ONE_DAY";
}

module.exports = {CoinbaseBaseURL, RequestPath, HttpMethod, resolveIntToApiGranularity}