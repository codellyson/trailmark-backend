/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(['r2'] as const),
  R2_KEY: Env.schema.string(),
  R2_SECRET: Env.schema.string(),
  R2_BUCKET: Env.schema.string(),
  R2_ENDPOINT: Env.schema.string(),
  PAYSTACK_WEBHOOK_SECRET: Env.schema.string(),
  APP_URL: Env.schema.string(),
  PAYSTACK_SECRET_KEY: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  BREVO_API_KEY: Env.schema.string(),
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.number(),
  SMTP_USERNAME: Env.schema.string(),
  SMTP_PASSWORD: Env.schema.string(),
  MAIL_FROM_ADDRESS: Env.schema.string(),
  MAIL_FROM_NAME: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the firebase package
  |----------------------------------------------------------
  */

  FIREBASE_SERVICE_ACCOUNT: Env.schema.string(),
  FIREBASE_PROJECT_ID: Env.schema.string(),
  // FIREBASE_PRIVATE_KEY_ID: Env.schema.string(),
  // FIREBASE_PRIVATE_KEY: Env.schema.string(),
  // FIREBASE_CLIENT_EMAIL: Env.schema.string(),
  // FIREBASE_CLIENT_ID: Env.schema.string(),
  // FIREBASE_AUTH_URI: Env.schema.string(),
  // FIREBASE_TOKEN_URI: Env.schema.string(),
  // FIREBASE_AUTH_PROVIDER_X509_CERT_URL: Env.schema.string(),
  // FIREBASE_CLIENT_X509_CERT_URL: Env.schema.string(),
})
