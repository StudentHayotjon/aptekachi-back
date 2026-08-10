import { Request, Response } from "express";
import { ApiResponse } from "../dtos/auth.dto";
import { AccessTokenPayload } from "../utils/jwt.util";

export type ReqType<
    Params = any,
    ReqBody = any,
    ReqQuery = any
> = Request<Params, any, ReqBody, ReqQuery>;

export type ResType<T = unknown> = Response<ApiResponse<T>>;

export interface AuthedRequest<
    Params = any,
    ReqBody = any,
    ReqQuery = any
> extends Request<Params, any, ReqBody, ReqQuery> {
    user?: AccessTokenPayload;
}
