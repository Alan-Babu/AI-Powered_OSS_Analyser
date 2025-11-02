import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) =>  {
    console.error('❌ Angular bootstrap failed:', err);
    alert('Bootstrap failed — check console for details');
  });
