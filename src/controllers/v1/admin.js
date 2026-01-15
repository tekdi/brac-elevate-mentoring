/**
 * name : admin.js
 * author : Nevil Mathew
 * created-date : 21-JUN-2023
 * Description : Admin Controller.
 */

// Dependencies
const adminService = require('@services/admin')
const common = require('@constants/common')
const httpStatusCode = require('@generics/http-status')
const responses = require('@helpers/responses')
const userExtensionQueries = require('@database/queries/userExtension')
const cacheHelper = require('@generics/cacheHelper')

module.exports = class admin {
	/**
	 * userDelete
	 * @method
	 * @name userDelete
	 * @param {Object} req -request data.
	 * @param {String} req.query.userId - User Id.
	 * @returns {JSON} - Success Response.
	 */

	async userDelete(req) {
		try {
			const userDelete = await adminService.userDelete(
				req.query.userId,
				req.decodedToken.id,
				req.decodedToken.organization_code,
				req.decodedToken.tenant_code,
				req.decodedToken.token
			)
			return userDelete
		} catch (error) {
			console.error('Controller error in userDelete:', error)
			return responses.failureResponse({
				statusCode: httpStatusCode.internal_server_error,
				message: 'USER_DELETION_FAILED',
				responseCode: 'SERVER_ERROR',
			})
		}
	}

	async triggerViewRebuild(req) {
		try {
			if (!req.decodedToken.roles.some((role) => role.title === common.ADMIN_ROLE)) {
				return responses.failureResponse({
					message: 'UNAUTHORIZED_REQUEST',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}
			// Build operation: ALWAYS build for ALL tenants - no parameters needed
			const result = await adminService.triggerViewRebuild()
			return result
		} catch (error) {
			return error
		}
	}
	async triggerPeriodicViewRefresh(req) {
		try {
			if (!req.decodedToken.roles.some((role) => role.title === common.ADMIN_ROLE)) {
				return responses.failureResponse({
					message: 'UNAUTHORIZED_REQUEST',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}
			// Extract model_name and tenant_code from query parameters
			const tenantCode = req.query.tenant_code || null
			return await adminService.triggerPeriodicViewRefresh(req.decodedToken, tenantCode, req.query.model_name)
		} catch (err) {
			console.log(err)
		}
	}
	async triggerViewRebuildInternal(req) {
		try {
			// Internal method - builds ALL materialized views for ALL tenants
			// No parameters needed - always builds everything
			// Ignore any query parameters - build is always for all tenants
			return await adminService.triggerViewRebuild()
		} catch (error) {
			return error
		}
	}
	async triggerPeriodicViewRefreshInternal(req) {
		try {
			// Log all query parameters, body, path params, headers, and URL for debugging
			console.log(`🔍 [TRIGGER PERIODIC VIEW REFRESH] Request method:`, req.method)
			console.log(`🔍 [TRIGGER PERIODIC VIEW REFRESH] Request query params:`, JSON.stringify(req.query))
			console.log(`🔍 [TRIGGER PERIODIC VIEW REFRESH] Request body:`, JSON.stringify(req.body))
			console.log(`🔍 [TRIGGER PERIODIC VIEW REFRESH] Request params:`, JSON.stringify(req.params))
			console.log(`🔍 [TRIGGER PERIODIC VIEW REFRESH] Request URL:`, req.url)
			console.log(`🔍 [TRIGGER PERIODIC VIEW REFRESH] Request originalUrl:`, req.originalUrl)

			let tenantCode = null
			let modelName = null

			// Check if tenant_code and model_name are encoded in path parameter (id)
			// Format: {tenantCode|modelName}
			if (req.params.id) {
				const parts = req.params.id.split('|')
				if (parts.length === 2) {
					tenantCode = decodeURIComponent(parts[0])
					modelName = decodeURIComponent(parts[1])
					console.log(
						`📋 [TRIGGER PERIODIC VIEW REFRESH] Extracted from path param: tenant=${tenantCode}, model=${modelName}`
					)
				}
			}

			// Fallback to query params (for manual GET requests) or body (for POST requests)
			if (!tenantCode) {
				tenantCode = req.query.tenant_code || req.body?.tenant_code
				modelName = req.query.model_name || req.body?.model_name
			}

			// Internal method - can refresh for specific tenant or all tenants
			if (!tenantCode) {
				console.log(
					'⚠️  [TRIGGER PERIODIC VIEW REFRESH] No tenant_code provided in path params, query params, or body, fetching all tenants...'
				)
				const tenants = await userExtensionQueries.getDistinctTenantCodes()

				if (tenants.length > 0) {
					console.log(
						`⚠️  [TRIGGER PERIODIC VIEW REFRESH] WARNING: Using first tenant: ${tenants[0].code} (from ${tenants.length} total tenants). This should not happen if scheduler jobs are configured correctly.`
					)
					return await adminService.triggerPeriodicViewRefreshInternal(modelName, tenants[0].code)
				}

				console.warn('⚠️  [TRIGGER PERIODIC VIEW REFRESH] No tenants found')
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'NO_TENANTS_FOUND',
				})
			}

			// Specific tenantCode provided - refresh for that tenant only
			console.log(
				`✅ [TRIGGER PERIODIC VIEW REFRESH] Using tenant_code: ${tenantCode}, model_name: ${
					modelName || 'all models'
				}`
			)
			return await adminService.triggerPeriodicViewRefreshInternal(modelName, tenantCode)
		} catch (err) {
			console.error('❌ Error in triggerPeriodicViewRefreshInternal:', err)
			return responses.failureResponse({
				statusCode: httpStatusCode.internal_server_error,
				message: 'MATERIALIZED_VIEW_REFRESH_FAILED',
				responseCode: 'SERVER_ERROR',
			})
		}
	}

	//Session Manager Deletion Flow Codes

	// async assignNewSessionManager(req) {
	// 	try {
	// 		const assignNewSessionManager = await adminService.assignNewSessionManager(req.decodedToken, req.query.oldSessionManagerId, req.query.newSessionManagerId, req.query.orgAdminUserId)
	// 		return assignNewSessionManager
	// 	} catch (error) {
	// 		return error
	// 	}
	// }

	/**
	 * Cache Administration APIs
	 */

	/**
	 * Get cache statistics and monitoring info
	 * @method
	 * @name getCacheStats
	 * @param {Object} req - request data
	 * @returns {JSON} - Cache statistics response
	 */
	async getCacheStats(req) {
		try {
			if (!req.decodedToken.roles.some((role) => role.title === common.ADMIN_ROLE)) {
				return responses.failureResponse({
					message: 'UNAUTHORIZED_REQUEST',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}

			const tenantCode = req.decodedToken.tenant_code
			const organizationId = req.decodedToken.organization_id

			return await adminService.getCacheStatistics(tenantCode, organizationId)
		} catch (error) {
			console.error('Controller error in getCacheStats:', error)
			return responses.failureResponse({
				statusCode: httpStatusCode.internal_server_error,
				message: 'CACHE_STATS_FETCH_FAILED',
				responseCode: 'SERVER_ERROR',
			})
		}
	}

	/**
	 * Clear cache for specific namespace or tenant
	 * @method
	 * @name clearCache
	 * @param {Object} req - request data
	 * @param {String} req.query.namespace - Namespace to clear (optional)
	 * @param {String} req.query.tenantCode - Tenant code to clear (optional)
	 * @param {String} req.query.orgId - Organization ID to clear (optional)
	 * @returns {JSON} - Cache clear response
	 */
	async clearCache(req) {
		try {
			if (!req.decodedToken.roles.some((role) => role.title === common.ADMIN_ROLE)) {
				return responses.failureResponse({
					message: 'UNAUTHORIZED_REQUEST',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}

			const { namespace, tenantCode, orgId } = req.query
			const adminTenantCode = req.decodedToken.tenant_code
			const adminOrgId = req.decodedToken.organization_id

			return await adminService.clearCache({
				namespace,
				tenantCode: tenantCode || adminTenantCode,
				orgId: orgId || adminOrgId,
				adminTenantCode,
				adminOrgId,
			})
		} catch (error) {
			console.error('Controller error in clearCache:', error)
			return responses.failureResponse({
				statusCode: httpStatusCode.internal_server_error,
				message: 'CACHE_CLEAR_FAILED',
				responseCode: 'SERVER_ERROR',
			})
		}
	}

	/**
	 * Warm up cache for specific tenant/org
	 * @method
	 * @name warmUpCache
	 * @param {Object} req - request data
	 * @param {String} req.query.tenantCode - Tenant code to warm up (optional)
	 * @param {String} req.query.orgCode - Organization code to warm up (optional)
	 * @returns {JSON} - Cache warm up response
	 */
	async warmUpCache(req) {
		try {
			if (!req.decodedToken.roles.some((role) => role.title === common.ADMIN_ROLE)) {
				return responses.failureResponse({
					message: 'UNAUTHORIZED_REQUEST',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}

			const { tenantCode, orgCode } = req.query
			const adminTenantCode = req.decodedToken.tenant_code
			const adminOrgCode = req.decodedToken.organization_code
			const adminOrgId = req.decodedToken.org

			return await adminService.warmUpCache({
				tenantCode: tenantCode || adminTenantCode,
				orgCode: orgCode || adminOrgCode,
				adminTenantCode,
				adminOrgCode,
			})
		} catch (error) {
			console.error('Controller error in warmUpCache:', error)
			return responses.failureResponse({
				statusCode: httpStatusCode.internal_server_error,
				message: 'CACHE_WARMUP_FAILED',
				responseCode: 'SERVER_ERROR',
			})
		}
	}

	/**
	 * Get cache configuration and health
	 * @method
	 * @name getCacheHealth
	 * @param {Object} req - request data
	 * @returns {JSON} - Cache health response
	 */
	async getCacheHealth(req) {
		try {
			if (!req.decodedToken.roles.some((role) => role.title === common.ADMIN_ROLE)) {
				return responses.failureResponse({
					message: 'UNAUTHORIZED_REQUEST',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}

			return await adminService.getCacheHealth()
		} catch (error) {
			console.error('Controller error in getCacheHealth:', error)
			return responses.failureResponse({
				statusCode: httpStatusCode.internal_server_error,
				message: 'CACHE_HEALTH_CHECK_FAILED',
				responseCode: 'SERVER_ERROR',
			})
		}
	}
}
