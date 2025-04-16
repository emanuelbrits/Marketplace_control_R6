import { Component, OnInit } from '@angular/core';
import { supabase } from '../../supabase-client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

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

  // Filtros
  filtroTipo: string = '';
  filtroArma: string = '';
  filtroOperador: string = '';

  // Opções para os selects
  opcoesTipo: string[] = ['ARMA', 'AMULETO', 'ESTAMPA PARA ADICIONAL', 'HEADGEAR', 'UNIFORM', 'RETRATO DE AGENTE'];
  opcoesArmas: string[] = [];
  opcoesOperadores: string[] = [];

  // Modal
  modalAberto = false;
  modalItem: any = { campo1: '', campo2: '', campo3: '', campo4: '' };

  async ngOnInit() {
    await this.carregarItens();
    await this.carregarOpcoes(); // Carregar as opções para os filtros
  }

  constructor(private router: Router) { }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error.message);
      } else {
        // Redireciona para a página de login ou outra página
        this.router.navigate(['/login']);
      }
    } catch (err) {
      console.error('Erro inesperado ao fazer logout:', err);
    }
  }

  async carregarItens() {
    this.loading = true;
    this.itens = []; // Limpa a lista de itens
    const batchSize = 1000; // Tamanho do lote a ser carregado
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('itens')
        .select('*')
        .range(from, from + batchSize - 1); // Define o intervalo do lote

      if (error) {
        console.error('Erro ao buscar itens:', error.message);
        break; // Encerra em caso de erro
      }

      if (!data || data.length === 0) {
        break; // Sai do loop se não houver mais registros
      }

      this.itens.push(...data); // Adiciona os registros carregados
      from += batchSize; // Avança para o próximo lote
    }

    this.totalItens = this.itens.length; // Atualiza o total de itens carregados
    this.applySearch(); // Aplica o filtro de busca
    this.loading = false;
  }

  async carregarOpcoes() {
    // Carrega as opções de armas e operadores para os filtros
    const { data: armas, error: armasError } = await supabase
      .from('itens')
      .select('arma_operador')
      .eq('tipo', 'WEAPON SKIN'); // Considera apenas as armas

    const { data: operadores, error: operadoresError } = await supabase
      .from('itens')
      .select('arma_operador')
      .in('tipo', ['HEADGEAR', 'UNIFORM']); // Considera apenas os operadores

    if (armasError || operadoresError) {
      console.error('Erro ao buscar opções:', armasError?.message, operadoresError?.message);
    } else {
      // Garantir que as opções sejam únicas utilizando Set
      this.opcoesArmas = [...new Set(armas?.map((item: { arma_operador: string }) => item.arma_operador) || [])];
      this.opcoesOperadores = [...new Set(operadores?.map((item: { arma_operador: string }) => item.arma_operador) || [])];
    }
  }

  onTipoChange() {
    // Quando o tipo de item for alterado, limpa os filtros de arma e operador
    this.filtroArma = '';
    this.filtroOperador = '';
    this.applyPagination(); // Reaplica a paginação e filtros
  }

  applySearch() {
    // Aplica a busca no array de itens
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
    const inicio = (this.page - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;

    // Aplica o filtro de tipo e outros
    this.filteredItens = this.itens.filter(item => {
      const matchesTipo = this.checkTipoFilter(item);
      const matchesArma = this.filtroArma ? item.arma_operador === this.filtroArma : true;
      const matchesOperador = this.filtroOperador ? item.arma_operador === this.filtroOperador : true;
      const matchesSearch = this.searchQuery
        ? item.nome.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;

      return matchesTipo && matchesArma && matchesOperador && matchesSearch;
    }).slice(inicio, fim); // Aplica a paginação aos itens filtrados
  }

  checkTipoFilter(item: any): boolean {
    if (!this.filtroTipo) return true;

    if (this.filtroTipo === 'ARMA') {
      return item.tipo === 'PRIMARY_WEAPON' || item.tipo === 'SECONDARY_WEAPON' || item.tipo === 'WEAPON SKIN';
    }

    if (this.filtroTipo === 'AMULETO') {
      return item.tipo === 'UNIVERSAL WEAPON CHARM';
    }

    if (this.filtroTipo === 'ESTAMPA PARA ADICIONAL') {
      return item.tipo === 'ATTACHMENT SKIN SET' || item.tipo === 'UNIVERSAL ATTACHMENT SKIN SET';
    }

    if (this.filtroTipo === 'HEADGEAR') {
      return item.tipo === 'HEADGEAR';
    }

    if (this.filtroTipo === 'UNIFORM') {
      return item.tipo === 'UNIFORM';
    }

    if (this.filtroTipo === 'RETRATO DE AGENTE') {
      return item.tipo === 'OPERATOR PORTRAIT';
    }

    return item.tipo === this.filtroTipo;
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

    // Obtém o ID do usuário autenticado
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
      console.error('Erro ao obter usuário autenticado:', userError?.message);
      alert('Erro ao identificar o usuário. Faça login novamente.');
      return;
    }

    // Converte a data e hora para o formato esperado, ajustando para o fuso horário de Brasília
    const dataCompraLocal = new Date(this.modalItem.campo2);
    const dataCompraBrasilia = new Date(
      dataCompraLocal.getTime() -
      dataCompraLocal.getTimezoneOffset() * 60000 +
      3 * 60 * 60 * 1000
    );

    const novoInvestimento = {
      id_item: this.modalItem.id, // ID do item selecionado
      valor_compra: this.modalItem.campo1,
      data_compra: dataCompraBrasilia.toISOString(), // ISO ajustado para horário local
      id_usuario: user.user.id, // Adiciona o ID do usuário autenticado
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
