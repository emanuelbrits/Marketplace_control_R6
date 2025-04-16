import { Component, EventEmitter, OnInit } from '@angular/core';
import { supabase } from '../../supabase-client'; // Ajuste conforme o seu projeto
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface Investimento {
  id: number;
  id_item: string;
  nome: string;
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
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule]
})
export class InvestimentosComponent implements OnInit {
  investimentos: Investimento[] = [];
  loading = false;
  error: string | null = null;
  isModalOpen = false;  // Controla a exibição do modal
  currentInvestimento: Investimento = {} as Investimento;

  quantidadeInvestida = 0; // Valor total gasto
  retornoObtido = 0; // Valor total de retorno
  retornoEstimado = 0

  statusFiltro: 'aguardando' | 'vendidos' = 'aguardando';

  statusOrdenacao: 'recente' | 'antigo' = 'recente';

  get investimentosFiltrados() {
    const filtrados = this.investimentos.filter((investimento) =>
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

  ngOnInit() {
    this.carregarInvestimentos();
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
          itens (nome, url_foto)
        `)
        .eq('id_usuario', user.id) // Filtra pelo ID do usuário
        .order('data_compra', { ascending: true }); // Ordena por data_compra

      if (error) {
        throw error;
      }

      let totalInvestido = 0;
      let totalRetorno = 0;
      let totalretornoEstimado = 0;

      // Mapear os dados e adicionar as novas propriedades
      this.investimentos = (data || []).map((item: any) => {
        const dataCompra = new Date(item.data_compra);
        const dataVenda = new Date(dataCompra);
        dataVenda.setDate(dataCompra.getDate() + 15); // Adiciona 15 dias à data de compra

        const valorMinimoVenda = Math.round(item.valor_compra / 0.9); // Remove as casas decimais do valor mínimo de venda

        // Acumular os valores
        if (item.valor_vendido === 0) {
          totalInvestido += item.valor_compra;
          totalretornoEstimado += 60; // Exemplo de cálculo para retorno estimado
        }

        if (item.valor_vendido > 0) {
          totalRetorno += (item.valor_vendido * 0.9) - item.valor_compra; // Subtraindo 10% do valor vendido
        }

        return {
          id: item.id,
          id_item: item.id_item,
          nome: item.itens.nome,
          valor_compra: item.valor_compra,
          valor_vendido: item.valor_vendido,
          data_compra: item.data_compra,
          foto_url: item.itens.url_foto,
          data_venda: dataVenda.toISOString(), // Inclui hora e minuto na data
          valor_minimo_venda: valorMinimoVenda, // Adiciona o valor mínimo de venda
        };
      });

      // Atualizar os totais
      this.quantidadeInvestida = totalInvestido;
      this.retornoObtido = Math.trunc(totalRetorno);
      this.retornoEstimado = totalretornoEstimado;
    } catch (err: any) {
      this.error = `Erro ao carregar os investimentos: ${err.message}`;
    } finally {
      this.loading = false;
    }
  }

  async updateInvestimento() {
    // Criação da data ajustada para o horário de Brasília
    const dataCompraLocal = new Date(this.currentInvestimento.data_compra);
    const dataCompraBrasilia = new Date(dataCompraLocal.getTime() - (dataCompraLocal.getTimezoneOffset() * 60000) + (3 * 60 * 60 * 1000));

    this.currentInvestimento.data_compra = dataCompraBrasilia.toISOString();

    // Atualiza o investimento
    try {
      const { error } = await supabase
        .from('investimento')
        .update({
          valor_compra: this.currentInvestimento.valor_compra,
          valor_vendido: this.currentInvestimento.valor_vendido,
          data_compra: this.currentInvestimento.data_compra,
        })
        .eq('id', this.currentInvestimento.id);

      if (error) throw error;

      // Após salvar, recarregue a página
      window.location.reload(); // Recarrega a página

    } catch (err: any) {
      this.error = `Erro ao atualizar o investimento: ${err.message}`;
    }
  }


  // Método para remover o investimento
  async removeInvestimento() {
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


  openEditModal(investimento: Investimento) {
    this.currentInvestimento = { ...investimento };  // Cria uma cópia para edição
    this.isModalOpen = true;  // Exibe o modal
  }

  // Fechar modal
  closeModal() {
    this.isModalOpen = false;
  }
}
