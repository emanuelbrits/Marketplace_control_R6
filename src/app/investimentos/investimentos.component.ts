import { Component, EventEmitter, OnInit } from '@angular/core';
import { supabase } from '../../supabase-client'; // Ajuste conforme o seu projeto
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { ChevronDown, ChevronUp, LucideAngularModule } from 'lucide-angular';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { ViewChildren, ElementRef, QueryList } from '@angular/core';
import { NgZone } from '@angular/core';

interface Investimento {
  id: number;
  id_item: string;
  nome: string;
  tipo: string; // Adiciona tipo opcional
  valor_compra: number;
  valor_vendido: number;
  data_compra: string;
  foto_url: string;
  data_venda: string; // Nova variável para a data de venda
  valor_minimo_venda: number; // Nova variável para o valor mínimo de venda
}

@Component({
  selector: 'app-investimentos',
  templateUrl: './investimentos.component.html',
  styleUrls: ['./investimentos.component.css'],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, NavbarComponent, LucideAngularModule],
  animations: [
    trigger('detalheAnimacao', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('600ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ]),
    ])
  ]
})
export class InvestimentosComponent implements OnInit {
  constructor(private router: Router, private http: HttpClient, private ngZone: NgZone) { }

  investimentos: Investimento[] = [];
  investimentosFiltradosBusca: any[] = []; // O que será exibido no *ngFor
  searchQuery: string = '';
  valoresMedios: { [id: string]: string } = {};
  loading = false;
  error: string | null = null;
  isModalOpen = false;  // Controla a exibição do modal
  currentInvestimento: Investimento = {} as Investimento;
  quantidadeInvestida = 0; // Valor total gasto
  retornoObtido = 0; // Valor total de retorno
  retornoEstimado = 0
  statusFiltro: 'aguardando' | 'vendidos' = 'aguardando';
  statusOrdenacao: 'recente' | 'antigo' = 'recente';
  detalheAbertoId: string | null = null;
  public investimentoEditando: { [key: string]: Investimento } = {};

  icons = { ChevronDown, ChevronUp };

  @ViewChildren('cardRef') cardElements!: QueryList<ElementRef>;

  toggleDetalhes(id: string) {
    const investimentoOriginal = this.investimentosFiltrados.find(item => item.id_item === id);
    this.investimentoEditando[id] = { ...investimentoOriginal };

    // Se o mesmo já estiver aberto, fecha
    if (this.detalheAbertoId === id) {
      this.detalheAbertoId = null;

    } else {
      this.detalheAbertoId = id;
      // Scroll até o card
      setTimeout(() => {
        const elements = this.cardElements?.toArray();
        const cardElement = elements.find(el => el.nativeElement.id === `card-${id}`);
        cardElement?.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }

  isDetalheVisivel(id: string): boolean {
    return this.detalheAbertoId === id;
  }

  setFiltro(filtro: 'aguardando' | 'vendidos') {
    this.detalheAbertoId = null;
    this.statusFiltro = filtro;

  }

  setOrdenacao(ordem: 'recente' | 'antigo') {
    this.detalheAbertoId = null;
    this.statusOrdenacao = ordem;
  }

  carregarValoresMedios() {
    this.investimentosFiltrados.forEach((item) => {
      this.http.get<{ valorMedio: string }>(`https://valormedio-m7s4cidcaa-uc.a.run.app/valorMedio?itemId=${item.id_item}`)
        .subscribe({
          next: (res) => {
            this.valoresMedios[item.id_item] = res.valorMedio;
            this.retornoEstimado += Math.trunc(Number((Number(res.valorMedio) - (Number(res.valorMedio) * 0.1)) - item.valor_compra))
          },
          error: (err) => {
            console.error(`Erro ao buscar valor médio do item ${item.id_item}`, err);
          }
        });
    });
  }

  get investimentosFiltrados() {
    const filtrados = this.investimentosFiltradosBusca.filter((investimento) =>
      this.statusFiltro === 'aguardando'
        ? investimento.valor_vendido === 0
        : investimento.valor_vendido > 0
    );

    return filtrados.sort((a, b) => {
      const dataA = new Date(a.data_compra).getTime();
      const dataB = new Date(b.data_compra).getTime();
      return this.statusOrdenacao === 'recente' ? dataB - dataA : dataA - dataB;
    });
  }

  applySearch() {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      this.investimentosFiltradosBusca = [...this.investimentos];
      return;
    }

    this.investimentosFiltradosBusca = this.investimentos.filter(investimento =>
      investimento.nome.toLowerCase().includes(query)
    );
  }

  async ngOnInit() {
    await this.carregarInvestimentos();
    this.investimentosFiltradosBusca = [...this.investimentos];
    this.carregarValoresMedios();
  }

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

  formatDateForInput(dateString: string | null): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));

    return localDate.toISOString().slice(0, 16); // Formato: YYYY-MM-DDTHH:mm
  }


  async carregarInvestimentos() {
    try {
      this.loading = true;

      // Obtém o usuário autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Usuário não autenticado.');
      }

      // Busca os investimentos do usuário logado com as informações do item relacionado
      const { data, error } = await supabase
        .from('investimento')
        .select(`
          id,
          id_item,
          valor_compra,
          valor_vendido,
          data_compra,
          itens (nome, url_foto, tipo)
        `)
        .eq('id_usuario', user.id) // Filtra pelo ID do usuário
        .order('data_compra', { ascending: true }); // Ordena por data_compra

      if (error) {
        throw error;
      }

      let totalInvestido = 0;
      let totalRetorno = 0;

      // Mapear os dados e adicionar as novas propriedades
      this.investimentos = (data || []).map((item: any) => {
        const dataCompra = new Date(item.data_compra);
        const dataVenda = new Date(dataCompra);
        dataVenda.setDate(dataCompra.getDate() + 15); // Adiciona 15 dias à data de compra

        const valorMinimoVenda = Math.round(item.valor_compra / 0.9); // Remove as casas decimais do valor mínimo de venda

        // Acumular os valores
        if (item.valor_vendido === 0) {
          totalInvestido += item.valor_compra;
        }

        if (item.valor_vendido > 0) {
          totalRetorno += (item.valor_vendido * 0.9) - item.valor_compra; // Subtraindo 10% do valor vendido
        }

        return {
          id: item.id,
          id_item: item.id_item,
          nome: item.itens.nome,
          tipo: item.itens.tipo,
          valor_compra: item.valor_compra,
          valor_vendido: item.valor_vendido,
          data_compra: this.formatDateForInput(item.data_compra),
          foto_url: item.itens.url_foto,
          data_venda: dataVenda.toISOString(), // Inclui hora e minuto na data
          valor_minimo_venda: valorMinimoVenda, // Adiciona o valor mínimo de venda
        };
      });

      // Atualizar os totais
      this.quantidadeInvestida = totalInvestido;
      this.retornoObtido = Math.trunc(totalRetorno);
    } catch (err: any) {
      this.error = `Erro ao carregar os investimentos: ${err.message}`;
    } finally {
      this.loading = false;
    }
  }

  async updateInvestimento(id: number) {
    const investimentoAtualizado = this.investimentoEditando[id];

    try {
      const dataCompraLocal = new Date(investimentoAtualizado.data_compra);

      if (isNaN(dataCompraLocal.getTime())) {
        this.error = 'Data inválida.';
        return;
      }

      const dataCompraBrasilia = new Date(dataCompraLocal.getTime() - (dataCompraLocal.getTimezoneOffset() * 60000) + (3 * 60 * 60 * 1000));
      const dataCompraISO = dataCompraBrasilia.toISOString();

      const { error } = await supabase
        .from('investimento')
        .update({
          valor_compra: investimentoAtualizado.valor_compra,
          valor_vendido: investimentoAtualizado.valor_vendido,
          data_compra: dataCompraISO,
        })
        .eq('id', investimentoAtualizado.id);

      if (error) throw error;

      // Atualiza os dados locais após salvar
      const investimentoOriginal = this.investimentosFiltrados.find(item => item.id_item === id);
      if (investimentoOriginal) {
        investimentoOriginal.valor_compra = investimentoAtualizado.valor_compra;
        investimentoOriginal.valor_vendido = investimentoAtualizado.valor_vendido;
        investimentoOriginal.data_compra = investimentoAtualizado.data_compra;
      }

    } catch (err: any) {
      this.error = `Erro ao atualizar o investimento: ${err.message}`;
    }
  }

  // Método para remover o investimento
  async removeInvestimento(investimento: Investimento) {
    this.currentInvestimento = { ...investimento };
    // Confirmação antes de remover
    const confirmDelete = confirm('Tem certeza de que deseja remover este investimento?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('investimento')
        .delete()
        .eq('id', this.currentInvestimento.id);

      if (error) throw error;

      // Após remover, recarregue a página
      window.location.reload(); // Recarrega a página
    } catch (err: any) {
      this.error = `Erro ao remover o investimento: ${err.message}`;
    }
  }

  openMarketplace(id: string) {
    window.open(`https://www.ubisoft.com/en-us/game/rainbow-six/siege/marketplace?route=sell%2Fitem-details&itemId=${id}`)
  }
}
