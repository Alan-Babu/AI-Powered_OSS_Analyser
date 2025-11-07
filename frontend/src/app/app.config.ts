import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideMarkdown } from 'ngx-markdown';
import { provideStore} from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { ScanEffects } from './statemanagement/scan/scan.effects';
import { scanReducer } from './statemanagement/scan/scan.reducer';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { ApiService } from './services/api.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import {provideToastr} from 'ngx-toastr';


import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(withFetch(),withInterceptorsFromDi()),
    provideAnimations(),
    provideMarkdown({loader: HttpClient}),
    provideStore({scan: scanReducer}),
    provideEffects([ScanEffects]),
    provideToastr({
      positionClass: 'toast-bottom-right',
      timeOut: 3000,
      closeButton: true,
      progressBar: true
    }),
    //provideStoreDevtools(),
    ApiService,
    AuthInterceptor,
    { provide: 'BOOTCHECK', useFactory: () => console.log('✅ appConfig loaded!') } // ✅ test
  ]
};
