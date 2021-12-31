// 修改自 https://github.com/chimurai/http-proxy-middleware/blob/master/src/path-rewriter.ts
const isPlainObj = require('is-plain-obj');

const logger = require('../server/utils/logger');

module.exports = (rewriteConfig, filterOptions) => {
    const rewriteFn = createPathRewriter(rewriteConfig);
    return interceptor => {
        return interceptor.request.add(({request}) => {
            // TODO 这里是url重写
            // '^/api/old-path': '/api/new-path'
            const result = rewriteFn(request.url);
            if (result) {
                request.url = result;
            }
        }, filterOptions);
    };
};
/**
 * Create rewrite function, to cache parsed rewrite rules.
 *
 * @param {Object} rewriteConfig
 * @return {Function} Function to rewrite paths; This function should accept `path` (request.url) as parameter
 */
function createPathRewriter(rewriteConfig) {
    let rulesCache;

    if (!isValidRewriteConfig(rewriteConfig)) {
        return;
    }

    if (typeof rewriteConfig === 'function') {
        const customRewriteFn = rewriteConfig;
        return customRewriteFn;
    }
    rulesCache = parsePathRewriteRules(rewriteConfig);
    return rewritePath;

    function rewritePath(path) {
        let result = path;

        for (const rule of rulesCache) {
            if (rule.regex.test(path)) {
                result = result.replace(rule.regex, rule.value);
                logger.debug('Rewriting path from "%s" to "%s"', path, result);
                break;
            }
        }

        return result;
    }
}

function isValidRewriteConfig(rewriteConfig) {
    if (typeof rewriteConfig === 'function') {
        return true;
    } else if (isPlainObj(rewriteConfig)) {
        return Object.keys(rewriteConfig).length !== 0;
    } else if (rewriteConfig === undefined || rewriteConfig === null) {
        return false;
    }
    throw new Error('Invalid path-rewrite config');
}

function parsePathRewriteRules(rewriteConfig) {
    const rules = [];

    if (isPlainObj(rewriteConfig)) {
        for (const [key] of Object.entries(rewriteConfig)) {
            rules.push({
                regex: new RegExp(key),
                value: rewriteConfig[key]
            });
            logger.info('Proxy rewrite rule created: "%s" ~> "%s"', key, rewriteConfig[key]);
        }
    }

    return rules;
}
