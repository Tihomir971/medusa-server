import { loadEnv, defineConfig } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

module.exports = defineConfig({
	projectConfig: {
		databaseUrl: process.env.DATABASE_URL,
		redisUrl: process.env.REDIS_URL,
		// FIXED: Changed from WORKER_MODE to MEDUSA_WORKER_MODE
		workerMode: process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server',
		http: {
			storeCors: process.env.STORE_CORS!,
			adminCors: process.env.ADMIN_CORS!,
			authCors: process.env.AUTH_CORS!,
			jwtSecret: process.env.JWT_SECRET || 'supersecret',
			cookieSecret: process.env.COOKIE_SECRET || 'supersecret'
		}
	},
	admin: {
		disable: process.env.DISABLE_ADMIN === 'true',
		// FIXED: Changed from BACKEND_URL to MEDUSA_BACKEND_URL
		backendUrl: process.env.MEDUSA_BACKEND_URL
	},
	modules: [
		// Custom brand module
		{
			resolve: './src/modules/brand'
		},

		// FIXED: New Caching Module (replaces deprecated cache-redis)
		// Introduced in Medusa v2.11.0
		{
			resolve: '@medusajs/medusa/caching',
			options: {
				providers: [
					{
						resolve: '@medusajs/caching-redis',
						id: 'caching-redis',
						is_default: true,
						options: {
							redisUrl: process.env.REDIS_URL
						}
					}
				]
			}
		},

		// Redis Event Bus Module
		{
			resolve: '@medusajs/medusa/event-bus-redis',
			options: {
				redisUrl: process.env.REDIS_URL
			}
		},

		// Redis Workflow Engine Module
		{
			resolve: '@medusajs/medusa/workflow-engine-redis',
			options: {
				redis: {
					redisUrl: process.env.REDIS_URL
				}
			}
		},

		// ADDED: Redis Locking Module (required for production)
		{
			resolve: '@medusajs/medusa/locking',
			options: {
				providers: [
					{
						resolve: '@medusajs/medusa/locking-redis',
						id: 'locking-redis',
						is_default: true,
						options: {
							redisUrl: process.env.REDIS_URL
						}
					}
				]
			}
		}

		// ADDED: File Storage Module (S3 or MinIO for production)
		// Uncomment and configure when ready to use S3 or other cloud storage
		/*
		{
			resolve: "@medusajs/medusa/file",
			options: {
				providers: [
					{
						resolve: "@medusajs/file-s3",
						id: "s3",
						options: {
							file_url: process.env.S3_FILE_URL,
							bucket: process.env.S3_BUCKET,
							region: process.env.S3_REGION,
							endpoint: process.env.S3_ENDPOINT,
							access_key_id: process.env.S3_ACCESS_KEY_ID,
							secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
						},
					},
				],
			},
		},
		*/

		// ADDED: Notification Module (SendGrid, Resend, etc.)
		// Uncomment and configure when ready to send emails
		/*
		{
			resolve: "@medusajs/medusa/notification",
			options: {
				providers: [
					{
						resolve: "@medusajs/notification-sendgrid",
						id: "sendgrid",
						options: {
							api_key: process.env.SENDGRID_API_KEY,
							from: process.env.SENDGRID_FROM,
						},
					},
				],
			},
		},
		*/
	]
});
