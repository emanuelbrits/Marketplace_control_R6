import { Component, Input, OnChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartDataset, ChartOptions } from 'chart.js';
import { CommonModule } from '@angular/common';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Component({
  selector: 'app-retorno-grafico',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './retorno-grafico.component.html'
})
export class RetornoGraficoComponent implements OnChanges {
  @Input() investimentos: any[] = [];
  loading = true;
  retornoEstimado: number = 0;
  retornoReal: number = 0;
  mostrarGrafico = false;

  labels: string[] = [];
  datasets: ChartDataset<'line'>[] = [];
  options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: 'white' }
      }
    },
    scales: {
      x: { ticks: { color: 'white' }, grid: { color: '#444' } },
      y: { ticks: { color: 'white' }, grid: { color: '#444' } }
    }
  };

  ngOnChanges(): void {
    this.gerarDadosGrafico();
    this.loading = false;
  }

  gerarDadosGrafico() {
    if (!this.investimentos) return;

    const retornoReal: Record<string, number> = {};
    const retornoEstimado: Record<string, number> = {};
    const datas: Record<string, string> = {}; // { "2024-12": "dez 24" }

    for (const item of this.investimentos) {
      const compra = new Date(item.data_compra);
      const venda = new Date(compra);
      venda.setDate(venda.getDate() + 15);

      const vendaKey = format(venda, 'yyyy-MM'); // formato técnico para ordenação
      const vendaLabel = format(venda, 'MMM yy', { locale: ptBR });

      datas[vendaKey] = vendaLabel;

      if (item.valor_vendido > 0) {
        const valor = item.valor_vendido * 0.9 - item.valor_compra;
        retornoReal[vendaKey] = (retornoReal[vendaKey] || 0) + valor;
        this.retornoReal += valor
        
      } else {
        const estimado = item.retornoEstimado;
        retornoEstimado[vendaKey] = (retornoEstimado[vendaKey] || 0) + estimado;
        this.retornoEstimado += estimado
      }
    }

    // Gerar conjunto único de meses (ordenados)
    const mesesUnicos = Array.from(
      new Set([
        ...Object.keys(retornoReal),
        ...Object.keys(retornoEstimado),
      ])
    ).sort();

    const mesesOrdenados = Object.keys(datas).sort(); // ordena por "2024-12", "2025-01", etc.

    this.labels = mesesOrdenados.map(key => datas[key]);

    this.datasets = [
      {
        label: 'Retorno Obtido',
        data: mesesOrdenados.map(m => retornoReal[m] || 0),
        borderColor: '#10B981',
        tension: 0.3,
        pointBackgroundColor: 'white'
      },
      {
        label: 'Retorno Estimado',
        data: mesesOrdenados.map(m => retornoEstimado[m] || 0),
        borderColor: '#F97316',
        borderDash: [5, 5],
        tension: 0.3,
        pointBackgroundColor: 'white'
      }
    ];

  }
}
