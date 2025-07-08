import { Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { supabase } from '../../supabase-client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { PaginationComponent } from "../shared/pagination/pagination.component";
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'home-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, PaginationComponent],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(1rem)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(1rem)' }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit {
  title = 'Lista de Itens em Cards';
  itens: any[] = [];
  filteredItens: any[] = [];
  paginaItens: any[] = [];
  loading = true;
  page = 1;
  itensPorPagina = 20;
  totalItens = 0;
  Math = Math;
  searchQuery = '';
  itemIdInput: string = '';
  isLoading = false;
  isAtBottom = false;
  showArrowDown = true;
  isAnimating = false;

  // Filtros
  filtroTipo: string = '';
  filtroArma: string = '';
  filtroOperador: string = '';

  // Opções para os selects
  opcoesTipo: string[] = ['ARMA', 'AMULETO', 'ESTAMPA PARA ADICIONAL', 'HEADGEAR', 'UNIFORM', 'RETRATO DE AGENTE', 'CARD BACKGROUND'];
  opcoesArmas: string[] = [];
  opcoesOperadores: string[] = [];

  // Modal
  modalAberto = false;
  modalItem: any = { campo1: '', campo2: '', campo3: '', campo4: '' };

  mensagem: string = '';
  tipoMensagem: 'success' | 'error' | '' = '';

  async ngOnInit() {
    await this.carregarItens();
    await this.carregarOpcoes(); // Carregar as opções para os filtros
  }

  constructor(private router: Router, private http: HttpClient, private renderer: Renderer2) { }

  adicionarItem(itemId: string) {
    this.isLoading = true;
    if (!itemId.trim()) {
      this.tipoMensagem = 'error';
      this.mensagem = 'ID do Item vazio!'
      this.isLoading = false;
      return;
    }

    console.log('Enviando itemId:', itemId);

    this.http.get<any>(`https://getitem-m7s4cidcaa-uc.a.run.app?itemId=${itemId}`).subscribe({
      next: async (res) => {
        console.log('Item recebido:', res);

        const novoItem = {
          id: itemId,
          nome: res.nome,
          url_foto: res.url_foto,
          tipo: res.tipo,
          arma_operador: res.arma_operador
        };

        const { data, error } = await supabase.from('itens').insert([novoItem]);

        this.isLoading = false;

        if (error) {
          console.error('Erro ao inserir no Supabase:', error);
          this.tipoMensagem = 'error';
          this.mensagem = 'Erro ao adicionar item.';
        } else {
          this.tipoMensagem = 'success';
          this.mensagem = 'Item adicionado com sucesso!';
          this.itemIdInput = ''; // limpar campo
        }

        setTimeout(() => {
          this.mensagem = '';
          this.tipoMensagem = '';
        }, 4000);
      },
      error: (err) => {
        console.error('Erro ao buscar item:', err);
        this.isLoading = false;
        this.tipoMensagem = 'error';
        this.mensagem = 'Erro ao buscar o item.';
        setTimeout(() => {
          this.mensagem = '';
          this.tipoMensagem = '';
        }, 4000);
      }
    });
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
      // Garantir que as opções sejam únicas e ordenadas alfabeticamente
      this.opcoesArmas = [...new Set(
        armas?.map((item: { arma_operador: string }) => item.arma_operador) || []
      )].sort((a, b) => a.localeCompare(b));

      this.opcoesOperadores = [...new Set(
        operadores?.map((item: { arma_operador: string }) => item.arma_operador) || []
      )].sort((a, b) => a.localeCompare(b));
    }
  }

  mostrarFiltros = false;
  filtroArmaSelecionada: string[] = [];
  filtroOperadorSelecionado: string[] = [];

  abrirFiltros() {
    this.mostrarFiltros = true;
    this.renderer.addClass(document.body, 'overflow-hidden');
  }

  // Quando os filtros forem fechados
  fecharFiltros() {
    this.mostrarFiltros = false;
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }

  limparFiltros() {
    this.filtroTipo = '';
    this.filtroArmaSelecionada = [];
    this.filtroOperadorSelecionado = [];
    this.searchQuery = '';
    this.applySearch();
  }

  ngOnDestroy(): void {
    // Garante que o scroll volta ao normal ao sair do componente
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }

  alternarArmaSelecionada(arma: string) {
    const index = this.filtroArmaSelecionada.indexOf(arma);
    if (index >= 0) {
      this.filtroArmaSelecionada.splice(index, 1);
    } else {
      this.filtroArmaSelecionada.push(arma);
    }
    this.applySearch();
  }

  alternarOperadorSelecionado(operador: string) {
    const index = this.filtroOperadorSelecionado.indexOf(operador);
    if (index >= 0) {
      this.filtroOperadorSelecionado.splice(index, 1);
    } else {
      this.filtroOperadorSelecionado.push(operador);
    }
    this.applySearch();
  }

  checkboxesArmas: { [key: string]: boolean } = {};
  checkboxesOperadores: { [key: string]: boolean } = {};

  chunkedArmas: string[][] = [];
  chunkedOperadores: string[][] = [];

  chunkArray(array: string[], tamanho: number): string[][] {
    const result = [];
    for (let i = 0; i < array.length; i += tamanho) {
      result.push(array.slice(i, i + tamanho));
    }
    return result;
  }

  onTipoChange() {
    this.filtroArmaSelecionada = [];
    this.filtroOperadorSelecionado = [];

    if (this.filtroTipo === 'ARMA') {
      this.chunkedArmas = this.chunkArray(this.opcoesArmas, 200);
    }

    if (this.filtroTipo === 'HEADGEAR' || this.filtroTipo === 'UNIFORM') {
      this.chunkedOperadores = this.chunkArray(this.opcoesOperadores, 200);
    }

    this.applySearch();
  }

  limparFiltroTipo() {
    this.filtroTipo = '';
    this.onTipoChange();
  }

  applySearch() {
    let resultado = this.itens;

    if (this.filtroTipo) {
      resultado = resultado.filter(i => this.checkTipoFilter(i));
    }

    if (this.filtroTipo === 'ARMA' && this.filtroArmaSelecionada.length > 0) {
      resultado = resultado.filter(i => this.filtroArmaSelecionada.includes(i.arma_operador));
    }

    if (
      (this.filtroTipo === 'HEADGEAR' || this.filtroTipo === 'UNIFORM') &&
      this.filtroOperadorSelecionado.length > 0
    ) {
      resultado = resultado.filter(i => this.filtroOperadorSelecionado.includes(i.arma_operador));
    }

    if (this.searchQuery?.trim()) {
      resultado = resultado.filter(i =>
        i.nome.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    this.filteredItens = resultado;
    this.totalItens = this.filteredItens.length;
    this.page = 1;
    this.atualizarItensDaPagina();
  }

  atualizarItensDaPagina() {
    const inicio = (this.page - 1) * this.itensPorPagina;
    const fim = this.page * this.itensPorPagina;
    this.paginaItens = this.filteredItens.slice(inicio, fim);
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

  // Função para abrir o modal e passar os dados do item
  abrirModal(item: any) {
    this.modalItem = {
      id: item.id,
      nome: item.nome,
      url_foto: item.url_foto,
      campo1: '',
      campo2: '',
    };
    this.modalAberto = true;
    this.renderer.addClass(document.body, 'overflow-hidden');
  }

  // Função para fechar o modal
  fecharModal() {
    this.modalAberto = false;
    this.renderer.removeClass(document.body, 'overflow-hidden');
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

  @HostListener('window:scroll', [])
    onWindowScroll() {
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.body.offsetHeight;
  
      const atBottom = scrollPosition >= pageHeight - 20;
  
      if (atBottom !== this.isAtBottom) {
        this.triggerIconAnimation(atBottom);
      }
    }
  
    triggerIconAnimation(atBottom: boolean) {
      this.isAnimating = true;
  
      // Aguarda o início da animação antes de trocar o ícone
      setTimeout(() => {
        this.showArrowDown = !atBottom; // Troca o ícone só depois de iniciar a animação
        this.isAnimating = false;
        this.isAtBottom = atBottom;
      }, 300); // Tempo da animação
    }

  scrollToPosition() {
    if (this.isAtBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }
}
