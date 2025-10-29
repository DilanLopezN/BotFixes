export interface IntegrationInternalApi {
  url: string;
  token: string;
  methods: {
    listAvailableExams: boolean;
  };
}
