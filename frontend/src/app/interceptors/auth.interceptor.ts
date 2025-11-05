import { Injectable } from "@angular/core";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthService } from "../services/auth.service";

@Injectable(
    { providedIn: 'root' }
)
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const authToken = this.authService.getToken();

        if (authToken) {
            console.log('✅ Attaching JWT to request:', req.url);
            const cloned = req.clone({
                setHeaders:{
                    Authorization: `Bearer ${authToken}`
                }
            });
            return next.handle(cloned);
        }
        console.warn('⚠️ No token found for request:', req.url);
        return next.handle(req);
    }
}