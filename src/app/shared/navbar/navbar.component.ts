import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../../../supabase-client';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  imports: [CommonModule, FormsModule]
})
export class NavbarComponent {
  isScrolled = false;

  constructor(private router: Router, private http: HttpClient) { }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      this.router.navigate(['/login']);
    } else {
      console.error('Erro ao sair:', error.message);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50; // ajuste o valor conforme desejar
  }
}
