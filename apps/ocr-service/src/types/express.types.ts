import { Request, Response } from "express";
import { ApiResponse } from "../dtos/presicription.dto";

export type ReqType<
    Params = any,
    ReqBody = any,
    ReqQuery = any
> = Request<Params, any, ReqBody, ReqQuery>;

export type ResType<T = unknown> = Response<ApiResponse<T>>;
