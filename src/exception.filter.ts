import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';

import { MongoError } from 'mongodb';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: InternalServerErrorException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status: HttpStatus;

    const responseMessage = ({ statusCode, message, error }) => {
      const errorPayload = {
        statusCode: statusCode,
        path: request.url,
        errorType: error,
        errorMessage: message,
      };

      return response.status(statusCode).send(errorPayload);
    };

    if (exception instanceof MongoError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;

      // Throw an exceptions for either
      // MongoError, ValidationError, TypeError, CastError and Error
      return responseMessage({
        error: exception.errorLabels,
        message: exception.errmsg,
        statusCode: status,
      });
    }

    try {
      return responseMessage(exception.getResponse() as any);
    } catch (e) {
      return responseMessage({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        error: exception.name,
      });
    }
  }
}
