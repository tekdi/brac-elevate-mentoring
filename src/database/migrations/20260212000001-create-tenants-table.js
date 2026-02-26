'use strict'

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('tenants', {
			code: {
				type: Sequelize.STRING(255),
				allowNull: false,
				primaryKey: true,
			},
			name: {
				type: Sequelize.STRING(255),
				allowNull: false,
			},
			status: {
				type: Sequelize.STRING(50),
				allowNull: false,
				defaultValue: 'ACTIVE',
			},
			description: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			logo: {
				type: Sequelize.STRING(500),
				allowNull: true,
			},
			meta: {
				type: Sequelize.JSONB,
				allowNull: true,
			},
			theming: {
				type: Sequelize.JSONB,
				allowNull: true,
			},
			created_by: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			updated_by: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('NOW()'),
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('NOW()'),
			},
			deleted_at: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		})
	},

	down: async (queryInterface) => {
		await queryInterface.dropTable('tenants')
	},
}
