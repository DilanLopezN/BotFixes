export const S3_BUCKET_NAME = 'botdesigner-erp-documents';

export const ALLOWED_MIMED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  // compatibilidade com fotos de iPhones
  'image/heic',
  'image/heif',
];

export const FILE_SIZE_LIMIT = 15_000_000; // 15MB
