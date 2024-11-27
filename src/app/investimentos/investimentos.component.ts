import { Component, OnInit } from '@angular/core';
import { supabase } from '../../supabase-client'; // Ajuste conforme o seu projeto
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';

function toBrasiliaTime(date: Date): Date {
  const brasiliaOffset = -3 * 60; // Horário de Brasília é UTC-3
  const localOffset = date.getTimezoneOffset(); // Deslocamento local do navegador
  const offsetDifference = brasiliaOffset - localOffset;

  // Ajustando a data para o horário de Brasília
  date.setMinutes(date.getMinutes() + offsetDifference);
  return date;
}

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

  ngOnInit() {
    this.carregarInvestimentos();
  }

  async carregarInvestimentos() {
    try {
      this.loading = true;

      // Busca os investimentos com as informações do item relacionado
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
        .order('valor_vendido', { ascending: true }) // Ordena por valor_vendido (nulo primeiro)
        .order('data_compra', { ascending: true }); // Ordena por data_compra (mais antigo primeiro)

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

        if (item.valor_vendido == null) {
          item.valor_vendido = 0;
        }

        // Acumular os valores
        totalInvestido += item.valor_compra;
        totalRetorno += item.valor_vendido * 0.9; // Subtraindo 10% do valor vendido

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
