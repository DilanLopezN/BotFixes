import * as Joi from 'joi';
import { registerAs } from '@nestjs/config';
import { validateSchema } from './common/helpers/config.helper';

const schema: Joi.ObjectSchema = Joi.object({
  uri: Joi.string().required(),
});

// const getEnvTest = () => {
//   return process.env.NODE_ENV === 'test' ? 'mongodb://bd__mongo1:27017/kissbot-integrations-test' : undefined;
// };

export default registerAs('database', () => {
  return validateSchema(schema, {
    uri: process.env.MONGO_INTEGRATIONS_URI || process.env.MONGO_URI,
  });
});
