import * as Joi from 'joi';
import { registerAs } from '@nestjs/config';
import { validateSchema } from './common/helpers/config.helper';

const schema: Joi.ObjectSchema = Joi.object({
  port: Joi.number().port(),
});

export default registerAs('app', () => {
  return validateSchema(schema, {
    port: process.env.INTEGRATIONS_PORT || process.env.NODE_ENV === 'local' ? 9093 : 9091,
  });
});
