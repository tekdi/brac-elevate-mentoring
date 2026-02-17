'use strict'

const cacheHelper = require('@generics/cacheHelper')

/**
 * Set organization details in cache
 */
exports.set = async (tenantCode, orgCode, orgId, data) => {
	return await cacheHelper.organizations.set(tenantCode, orgCode, orgId, data)
}

/**
 * Get organization details from cache
 */
exports.get = async (tenantCode, orgCode, orgId) => {
	return await cacheHelper.organizations.get(tenantCode, orgCode, orgId)
}
