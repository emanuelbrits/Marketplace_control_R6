import { Routes } from '@angular/router';
import { InvestimentosComponent } from './investimentos/investimentos.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [{ path: '', component: HomeComponent, canActivate: [AuthGuard] },
{ path: 'investimentos', component: InvestimentosComponent, canActivate: [AuthGuard] },
{ path: 'login', component: LoginComponent}
];
