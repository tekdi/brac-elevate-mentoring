// Dependencies
const httpStatusCode = require('@generics/http-status')
const responses = require('@helpers/responses')

const resourceQueries = require('@database/queries/resources')
const cacheHelper = require('@generics/cacheHelper')

module.exports = class SessionsHelper {
	/**
	 * Remove resources from session.
	 * @method
	 * @name deleteResource
	 * @param {String} resourceId 				- resource id.
	 * @param {String} sessionId 				- Session id.
	 * @returns {JSON} 							- deleted response
	 */

	static async deleteResource(resourceId, sessionId, userId, organizationId, tenantCode) {
		try {
			console.log(
				`🔍 [RESOURCE DELETE API] Called with - resourceId: ${resourceId}, sessionId: ${sessionId}, userId: ${userId}, tenantCode: ${tenantCode}`
			)

			// Optimized: Single query with JOIN validation - eliminates separate session existence check
			const deletedRows = await resourceQueries.deleteResourceByIdWithSessionValidation(resourceId, tenantCode)

			console.log(
				`📊 [RESOURCE DELETE API] Deletion result - deletedRows: ${deletedRows}, resourceId: ${resourceId}`
			)

			if (deletedRows === 0) {
				console.log(
					`❌ [RESOURCE DELETE API] Deletion failed - resourceId: ${resourceId}, sessionId: ${sessionId}`
				)
				return responses.failureResponse({
					message: 'RESOURCE_NOT_FOUND_OR_SESSION_INVALID',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			console.log(
				`✅ [RESOURCE DELETE API] Resource deleted successfully - resourceId: ${resourceId}, sessionId: ${sessionId}`
			)

			// Invalidate session cache after deleting resource
			try {
				await cacheHelper.sessions.delete(tenantCode, sessionId)
				console.log(`🗑️ [RESOURCE DELETE API] Session cache invalidated - sessionId: ${sessionId}`)
			} catch (cacheError) {
				console.log(
					`⚠️ [RESOURCE DELETE API] Cache invalidation failed (non-critical) - sessionId: ${sessionId}, error:`,
					cacheError.message
				)
				// Cache invalidation failure - continue operation
			}

			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'RESOURCE_DELETED_SUCCESSFULLY',
			})
		} catch (error) {
			console.error(`❌ [RESOURCE DELETE API] Unexpected error - resourceId: ${resourceId}, error:`, error)
			throw error
		}
	}
}
