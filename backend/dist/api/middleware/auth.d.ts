import { Request, Response, NextFunction } from 'express';
export declare const verifyFirebaseToken: (req: Request & {
    user?: any;
    uid?: string;
}, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map