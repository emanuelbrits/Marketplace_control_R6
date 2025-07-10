import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { ChevronDown, ChevronUp,AlarmClockCheck, LucideAngularModule, AlarmClockMinus, Check, X, BanknoteArrowUp, BanknoteArrowDown } from 'lucide-angular';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(
      LucideAngularModule.pick({ ChevronDown, ChevronUp, AlarmClockCheck, AlarmClockMinus, Check, X, BanknoteArrowUp, BanknoteArrowDown })
    ),
    provideCharts(withDefaultRegisterables()), 
  ],
}).catch(err => console.error(err));
