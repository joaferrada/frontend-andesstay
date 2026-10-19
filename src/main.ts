import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEsCl from '@angular/common/locales/es-CL';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

registerLocaleData(localeEsCl);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
