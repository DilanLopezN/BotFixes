import { SetMetadata } from '@nestjs/common';

export const SKIP_CHECK_WORKSPACE_KEY = 'skipCheckWorkspace';
export const SkipCheckWorkspace = () => SetMetadata(SKIP_CHECK_WORKSPACE_KEY, true);
