import { Component, OnInit } from '@angular/core';
import { supabase } from '../../supabase-client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'home-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class HomeComponent implements OnInit {
  title = 'Lista de Itens em Cards';
  itens: any[] = [];
  filteredItens: any[] = [];
  loading = true;
  page = 1;
  itensPorPagina = 20;
  totalItens = 0;
  Math = Math;
  searchQuery = '';

  // Modal
  modalAberto = false;
  modalItem: any = { campo1: '', campo2: '', campo3: '', campo4: '' };

  async ngOnInit() {
    await this.carregarItens();
  }

  async carregarItens() {
    this.loading = true;

    const { data, error, count } = await supabase
      .from('itens')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Erro ao buscar itens:', error.message);
    } else {
      this.itens = data || [];
      this.totalItens = count || 0;
      this.applySearch();
    }

    this.loading = false;
  }

  applySearch() {
    // Aplique a busca no array de itens
    if (this.searchQuery) {
      this.filteredItens = this.itens.filter(item =>
        item.nome.toLowerCase().includes(this.searchQuery.toLowerCase()) // Filtro baseado no nome
      );
    } else {
      this.filteredItens = [...this.itens]; // Se não houver busca, mostra todos os itens
    }

    // Resetar para a primeira página após aplicar o filtro
    this.page = 1;
    this.applyPagination(); // Aplica a paginação após o filtro
  }

  applyPagination() {
    // Calcular os itens que devem ser exibidos para a página atual
    const inicio = (this.page - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;

    // Aplica a paginação aos itens filtrados
    const itensFiltrados = this.searchQuery
      ? this.itens.filter(item => item.nome.toLowerCase().includes(this.searchQuery.toLowerCase()))
      : this.itens;

    // Aplica a paginação aos itens filtrados
    this.filteredItens = itensFiltrados.slice(inicio, fim);
  }

  // Funções de navegação
  proximaPagina() {
    if (this.page * this.itensPorPagina < this.totalItens) {
      this.page++;
      this.applyPagination();
    }
  }

  paginaAnterior() {
    if (this.page > 1) {
      this.page--;
      this.applyPagination();
    }
  }

  // Função para abrir o modal e passar os dados do item
  abrirModal(item: any) {
    this.modalItem = {
      id: item.id, // Pega o ID do item selecionado
      nome: item.nome,
      campo1: '', // Reseta o valor pago
      campo2: '', // Reseta a data de compra
    };
    this.modalAberto = true;
  }

  // Função para fechar o modal
  fecharModal() {
    this.modalAberto = false;
  }

  // Função para salvar os dados no modal
  async salvarModal() {
    if (!this.modalItem.campo1 || !this.modalItem.campo2) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    // Converte a data e hora para o formato esperado, ajustando para o fuso horário de Brasília
    const dataCompraLocal = new Date(this.modalItem.campo2);
    const dataCompraBrasilia = new Date(dataCompraLocal.getTime() - (dataCompraLocal.getTimezoneOffset() * 60000) + (3 * 60 * 60 * 1000));

    const novoInvestimento = {
      id_item: this.modalItem.id, // Pega o ID do item selecionado
      valor_compra: this.modalItem.campo1,
      data_compra: dataCompraBrasilia.toISOString(), // ISO ajustado para horário local
    };

    // Chama o Supabase para inserir o novo investimento
    const { data, error } = await supabase
      .from('investimento')
      .insert([novoInvestimento])
      .select();

    if (error) {
      console.error('Erro ao salvar investimento:', error.message);
      alert('Erro ao salvar investimento. Tente novamente.');
    } else {
      console.log('Investimento salvo com sucesso:', data);
      alert('Investimento salvo com sucesso!');
      this.fecharModal(); // Fecha o modal após salvar
    }
  }
}
