import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../../supabase-client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword: boolean = false;

  constructor(private router: Router) { }

  async login() {
    this.isLoading = true;
    this.errorMessage = '';

    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.password,
    });

    this.isLoading = false;

    if (error) {
      this.errorMessage = error.message;
    } else {
      console.log('Login realizado com sucesso:', data);
      this.router.navigate(['/']); // Redireciona para a página inicial
    }
  }

  async loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      this.errorMessage = error.message;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

}
