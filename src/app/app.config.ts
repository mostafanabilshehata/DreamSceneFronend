import { ApplicationConfig } from '@angular/core';
import { provideRouter, withViewTransitions, InMemoryScrollingOptions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(),
    provideAnimations()
  ]
};
