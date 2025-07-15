import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { supabase } from '../../../supabase-client';

interface Investimento {
  id: number;
  id_item: string;
  nome: string;
  tipo: string; // Adiciona tipo opcional
  valor_compra: number;
  valor_vendido: number;
  data_compra: string;
  foto_url: string;
  data_venda: string;
  data_vendaDate: Date; // Nova variável para a data de venda
  valor_minimo_venda: number; // Nova variável para o valor mínimo de venda
  ignorar: boolean;
}

@Component({
  selector: 'app-top-investimentos',
  templateUrl: './top-investimentos.component.html',
  imports: [CommonModule, DecimalPipe],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-0.5rem)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('500ms ease-out', style({ opacity: 0, transform: 'translateY(-0.5rem)' })),
      ])
    ])
  ]
})
export class TopInvestimentosComponent implements OnChanges {
  @Input() investimentos: any[] = [];
  top5: any[] = [];
  mostrarSugestoes = false;
  mostrarIgnorados = false;
  itensFiltrados: any[] = [];
  itensIgnorados: any[] = [];

  ngOnChanges(): void {
    this.calcularTop5();
  }

  calcularTop5() {
    if (!this.investimentos) return;

    const grupos = new Map<number, any[]>();

    this.investimentos.forEach(item => {
      if (!grupos.has(item.id_item)) {
        grupos.set(item.id_item, []);
      }
      grupos.get(item.id_item)!.push(item);
    });

    const todosTopItems: any[] = [];

    grupos.forEach((itens) => {
      const possuiAinda = itens.some(i => i.valor_vendido === 0);
      if (!possuiAinda) {
        const vendidos = itens.filter(i => i.valor_vendido > 0);
        const melhores = vendidos
          .map(i => ({
            ...i,
            lucroPercentual: ((i.valor_vendido * 0.9 - i.valor_compra) / i.valor_compra) * 100,
          }))
          .sort((a, b) => b.lucroPercentual - a.lucroPercentual);

        if (melhores.length > 0) {
          todosTopItems.push(melhores[0]);
        }
      }
    });

    // Filtra e limita separadamente
    this.itensFiltrados = todosTopItems
      .filter(i => !i.ignorar)
      .sort((a, b) => b.lucroPercentual - a.lucroPercentual)
      .slice(0, 5);

    this.itensIgnorados = todosTopItems
      .filter(i => i.ignorar)
      .sort((a, b) => b.lucroPercentual - a.lucroPercentual)
      .slice(0, 5);
  }

  atualizarListas() {
    this.itensFiltrados = this.top5.filter(i => i.ignorar === false);
    this.itensIgnorados = this.top5.filter(i => i.ignorar === true);
  }

  openMarketplace(investimento: Investimento) {
    if (investimento.valor_vendido > 0) {
      window.open(`https://www.ubisoft.com/en-us/game/rainbow-six/siege/marketplace?route=buy%2Fitem-details&itemId=${investimento.id_item}`, '_blank');
    }

    if (investimento.valor_vendido === 0) {
      window.open(`https://www.ubisoft.com/en-us/game/rainbow-six/siege/marketplace?route=sell%2Fitem-details&itemId=${investimento.id_item}`, '_blank');
    }
  }

  async turnIgnorar(investimento: Investimento) {

    investimento.ignorar = !investimento.ignorar;

    const { error } = await supabase
      .from('investimento')
      .update({
        ignorar: investimento.ignorar
      })
      .eq('id', investimento.id);

    if (error) throw error;

    // Atualiza o investimento no array
    const index = this.investimentos.findIndex(i => i.id === investimento.id);
    if (index !== -1) {
      this.investimentos[index] = investimento;
    }

    // Recalcula o top 5 após a alteração
    this.calcularTop5();
  }
}