export const formatException = (error: any) => {
  if (error instanceof AggregateError) {
    return null;
  }

  if (error?.response?.data) {
    return {
      status: error?.response?.status ?? error?.response?.statusCode,
      data: error?.response?.data,
    };
  }

  return error;
};
