import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { ChevronDown, ChevronUp,AlarmClockCheck, LucideAngularModule, AlarmClockMinus, Check, X } from 'lucide-angular';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(
      LucideAngularModule.pick({ ChevronDown, ChevronUp, AlarmClockCheck, AlarmClockMinus, Check, X })
    )
  ],
}).catch(err => console.error(err));
