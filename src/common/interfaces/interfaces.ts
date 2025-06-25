import { Request } from "express";
import { RunnerManagerAuthInfo } from "../../modules/runner-manager/interfaces/runner-manager-auth-info.interface";

export interface KissbotRequest extends Request {
    user: any;
    runnerManagerAuthInfo?: RunnerManagerAuthInfo;
    mismatchIp?: boolean;
}