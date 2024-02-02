/**
 * Define the error & exception handlers
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Application, ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import Log from '../middlewares/log';
import Locals from '../providers/locals';
import { JsonResponse } from '../helpers/JsonResponse.helper';
import HttpStatusCode from '../helpers/StatusCodes.helper';

class Handler {
	/**
	 * Handles all the not found routes
	 */
	public static notFoundHandler(_express:Application): any {
		const apiPrefix = Locals.config().apiPrefix;

		_express.use('*', (req:Request, res:Response) => {
			const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

			Log.error(`Path '${req.originalUrl}' not found [IP: '${ip}']!`);
			if (req.xhr || req.originalUrl.includes(`/${apiPrefix}/`)) {
				return JsonResponse.error(res, "Page Not Found",[], HttpStatusCode.NOT_FOUND)
			} else {
				res.status(404);
				return res.render('pages/error', {
					title: 'Page Not Found',
					error: []
				});
			}
		});

		return _express;
	}

	/**
	 * Handles your api/web routes errors/exception
	 */
	public static clientErrorHandler(err: { stack: string; }, req:Request, res: Response, next: NextFunction) {
		Log.error(err.stack);

		if (req.xhr) {
			return JsonResponse.error(res, "Something went wrong!", [], HttpStatusCode.INTERNAL_SERVER_ERROR);
		} else {
			return next(err);
		}
	}

	/**
	 * Show undermaintenance page incase of errors
	 */
	public static errorHandler(err: { stack: string; name: string; inner: { message: any; }; }, req: Request, res: Response, next: NextFunction) {


		const apiPrefix = Locals.config().apiPrefix;
		if (req.originalUrl.includes(`/${apiPrefix}/`)) {

			if (err.name && err.name === 'UnauthorizedError') {
				const innerMessage = err.inner && err.inner.message ? err.inner.message : undefined;
				return JsonResponse.error(res, "Unauthorized access attempted", [innerMessage], HttpStatusCode.UNAUTHORIZED)
			}

			return JsonResponse.error(res, "An error occurred with the request", [err], HttpStatusCode.INTERNAL_SERVER_ERROR)
		}

		return res.render('pages/error', { error: err.stack, title: 'Under Maintenance' });
	}

	/**
	 * Register your error / exception monitoring
	 * tools right here ie. before "next(err)"!
	 */
	public static logErrors(err: any, req: Request, res: Response, next: NextFunction) {
		Log.error(err.stack);

		return next(err);
	}
}

export default Handler;