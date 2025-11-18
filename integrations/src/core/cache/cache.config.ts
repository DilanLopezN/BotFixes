import * as Joi from 'joi';
import { registerAs } from '@nestjs/config';
import { validateSchema } from '../../common/helpers/config.helper';

const schema: Joi.ObjectSchema = Joi.object({
  redisHost: Joi.string().required(),
  redisPort: Joi.number().required(),
  redisPassword: Joi.string(),
  expiration: Joi.number().default(3600),
  nodeEnv: Joi.string(),
});

export default registerAs('cache', () => {
  return validateSchema(schema, {
    redisHost: process.env.REDIS_HOST_ELASTICACHE || process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT,
    redisPassword: process.env.REDIS_HOST_ELASTICACHE ? undefined : process.env.REDIS_PASSWORD,
    expiration: process.env.REDIS_CACHE_EXPIRATION,
    nodeEnv: process.env.NODE_ENV,
  });
});
