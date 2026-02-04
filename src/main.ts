import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  pricetag,
  location,
  business,
  refreshOutline,
  locationOutline,
  waterOutline,
  chevronDownCircleOutline,
  flash,
  sadOutline,
  navigateCircleOutline,
  navigate,
  trendingDown, navigateCircle, timeOutline, chevronBack, chevronForward,
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Register all Ionicons used across the app so they don't rely on
// dynamic URL loading (which was causing "Invalid URL" errors).
addIcons({
  pricetag,
  location,
  business,
  refreshOutline,
  locationOutline,
  waterOutline,
  chevronDownCircleOutline,
  flash,
  sadOutline,
  navigateCircleOutline,
  navigate,
  trendingDown,
  navigateCircle,
  timeOutline,
  chevronBack,
  chevronForward,
});

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(),
  ],
}).catch(err => console.log(err));
