import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../../../supabase-client';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  constructor(private router: Router) {}

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      this.router.navigate(['/login']);
    } else {
      console.error('Erro ao sair:', error.message);
    }
  }
}
