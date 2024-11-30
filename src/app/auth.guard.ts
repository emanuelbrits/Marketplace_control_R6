import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { supabase } from '../supabase-client';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) { }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      return true; // Permite acesso
    } else {
      this.router.navigate(['/login']); // Redireciona para login
      return false;
    }
  }
}
