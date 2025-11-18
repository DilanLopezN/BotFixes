import * as Joi from 'joi';
import { registerAs } from '@nestjs/config';
import { validateSchema } from '../../common/helpers/config.helper';

const schema: Joi.ObjectSchema = Joi.object({
  url: Joi.string().required(),
  token: Joi.string().required(),
});

export default registerAs('health-api', () => {
  return validateSchema(schema, {
    url: process.env.API_URI,
    token: process.env.API_TOKEN,
  });
});
