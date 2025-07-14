import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../../supabase-client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;

  constructor(private router: Router) {}

  async register() {
    this.isLoading = true;
    this.errorMessage = '';

    const { data, error } = await supabase.auth.signUp({
      email: this.email,
      password: this.password
    });

    this.isLoading = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    // Registro bem-sucedido
    this.router.navigate(['/login']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
