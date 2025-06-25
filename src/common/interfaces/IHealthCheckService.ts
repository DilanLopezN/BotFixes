export interface IHealthCheckService {
    ping: () => Promise<boolean>;
}
