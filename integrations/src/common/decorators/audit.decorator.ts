import { SetMetadata } from '@nestjs/common';

export const OMIT_AUDIT_KEY = 'omitAudit';

export const OmitAudit = () => SetMetadata(OMIT_AUDIT_KEY, true);
