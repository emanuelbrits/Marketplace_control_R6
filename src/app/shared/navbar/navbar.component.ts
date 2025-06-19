import { Component } from '@angular/core';
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
  itemIdInput: string = '';
  isLoading = false;

  constructor(private router: Router, private http: HttpClient) {}

  adicionarItem(itemId: string) {
    this.isLoading = true;
    if (!itemId.trim()) {
      console.warn('Item ID vazio!');
      this.isLoading = false;
      return;
    }

    console.log('Enviando itemId:', itemId);

    this.http.get<any>(`https://getitem-m7s4cidcaa-uc.a.run.app?itemId=${itemId}`)
      .subscribe({
        next: async (res) => {
          console.log('Item recebido:', res);

          // Estrutura esperada da resposta:
          const novoItem = {
            id: itemId,
            nome: res.nome,
            url_foto: res.url_foto,
            tipo: res.tipo,
            arma_operador: res.arma_operador
          };

          // Fazendo o insert no Supabase
          const { data, error } = await supabase.from('itens').insert([novoItem]);

          this.isLoading = false;

          if (error) {
            console.error('Erro ao inserir no Supabase:', error);
            this.isLoading = false;
          } else {
            window.alert('Item adicionado com sucesso!')
            window.location.reload();
          }
        },
        error: (err) => {
          console.error('Erro ao buscar item:', err);
          this.isLoading = false;
        }
      });
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      this.router.navigate(['/login']);
    } else {
      console.error('Erro ao sair:', error.message);
    }
  }
}
