import * as Joi from 'joi';
import { registerAs } from '@nestjs/config';
import { validateSchema } from '../common/helpers/config.helper';

const schema: Joi.ObjectSchema = Joi.object({
  url: Joi.string().required(),
  urlRead: Joi.string().required(),
});

export default registerAs('postgres', () => {
  return validateSchema(schema, {
    url: process.env.POSTGRESQL_URI,
    urlRead: process.env.POSTGRESQL_READ_URI,
  });
});
