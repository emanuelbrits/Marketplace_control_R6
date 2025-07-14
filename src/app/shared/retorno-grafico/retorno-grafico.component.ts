import { Component, Input, OnChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartDataset, ChartOptions } from 'chart.js';
import { CommonModule } from '@angular/common';
import { format } from 'date-fns';
import { es, ptBR } from 'date-fns/locale';

@Component({
  selector: 'app-retorno-grafico',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './retorno-grafico.component.html'
})
export class RetornoGraficoComponent implements OnChanges {
  @Input() investimentos: any[] = [];
  loading = true;
  mostrarGrafico = false;
  modalAberto = false;
  itensSelecionados: any[] = [];
  tipoGraficoSelecionado: 'real' | 'estimado' | null = null;
  dataSelecionada: string = '';

  retornoEstimado = 0;
  retornoReal = 0;

  retornoEstimadoDia = 0;
  retornoRealMes = 0;

  // Gráfico de retorno real (mensal)
  labelsRetornoReal: string[] = [];
  datasetRetornoReal: ChartDataset<'line'> = {
    label: 'Retorno Obtido',
    data: [],
    borderColor: '#10B981',
    tension: 0.3,
    pointBackgroundColor: 'white'
  };

  // Gráfico de retorno estimado (por dia)
  labelsEstimadoDias: string[] = [];
  datasetEstimadoDias: ChartDataset<'line'> = {
    label: 'Retorno Estimado',
    data: [],
    borderColor: '#F97316',
    borderDash: [5, 5],
    tension: 0.3,
    pointBackgroundColor: 'white'
  };

  options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { labels: { color: 'white' } }
    },
    scales: {
      x: { ticks: { color: 'white' }, grid: { color: '#444' } },
      y: { ticks: { color: 'white' }, grid: { color: '#444' } }
    }
  };

  ngOnChanges(): void {
    this.gerarDadosGrafico();
    this.loading = false;
    this.toggleBodyScroll(this.modalAberto);
  }

  toggleBodyScroll(ativo: boolean) {
    if (ativo) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }

  gerarDadosGrafico() {
    if (!this.investimentos?.length) return;

    this.retornoEstimado = 0;
    this.retornoReal = 0;

    // ----- RETORNO REAL POR MÊS -----
    const retornoRealMensal: Record<string, number> = {};
    const datasFormatadas: Record<string, string> = {};

    for (const item of this.investimentos) {
      if (item.valor_vendido > 0) {
        const compra = new Date(item.data_compra);
        const venda = new Date(compra);
        venda.setDate(compra.getDate() + 15);

        const chave = format(venda, 'yyyy-MM');
        const label = format(venda, 'MMM yy', { locale: ptBR });

        datasFormatadas[chave] = label;

        const lucro = item.valor_vendido * 0.9 - item.valor_compra;
        retornoRealMensal[chave] = (retornoRealMensal[chave] || 0) + lucro;
        this.retornoReal += lucro;
      }
    }

    const mesesOrdenados = Object.keys(retornoRealMensal).sort();
    this.labelsRetornoReal = mesesOrdenados.map(key => datasFormatadas[key]);
    this.datasetRetornoReal.data = mesesOrdenados.map(key => retornoRealMensal[key]);

    // ----- ESTIMATIVA POR DATA DE VENDA REAL -----
    const retornoEstimadoPorData: Record<string, number> = {}; // key = 'dd/MM'
    const datasUnicas: Set<string> = new Set();

    for (const item of this.investimentos) {
      if (item.valor_vendido === 0 && item.retornoEstimado) {
        const compra = new Date(item.data_compra);
        const venda = new Date(compra);
        venda.setDate(venda.getDate() + 15);

        const dataLabel = format(venda, 'dd/MM');
        datasUnicas.add(dataLabel);

        retornoEstimadoPorData[dataLabel] = (retornoEstimadoPorData[dataLabel] || 0) + item.retornoEstimado;
        this.retornoEstimado += item.retornoEstimado;
      }
    }

    // Ordenar as datas por data real, não por string
    const datasOrdenadas = Array.from(datasUnicas).sort((a, b) => {
      const da = new Date(a.split('/').reverse().join('-'));
      const db = new Date(b.split('/').reverse().join('-'));
      return da.getTime() - db.getTime();
    });

    this.labelsEstimadoDias = datasOrdenadas;
    this.datasetEstimadoDias.data = datasOrdenadas.map(data => retornoEstimadoPorData[data]);
  }

  onChartClick(event: any, tipo: 'real' | 'estimado') {
    const activePoints = event.active;
    if (!activePoints.length) return;

    const index = activePoints[0].index;

    if (tipo === 'real') {
      const dataLabel = this.labelsRetornoReal[index]; // Ex: "jul 24"
      this.dataSelecionada = dataLabel;
      let obtidoMes = 0;

      const [mesTexto, anoTexto] = dataLabel.split(' ');
      const mesesMap: any = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
      const mes = mesesMap[mesTexto];
      const ano = Number('20' + anoTexto); // "24" → 2024

      this.itensSelecionados = this.investimentos.filter(i => {
        if (i.valor_vendido > 0) {
          const compra = new Date(i.data_compra);
          const venda = new Date(compra);
          obtidoMes += i.valor_vendido * 0.9 - i.valor_compra;
          this.retornoRealMes = obtidoMes;
          venda.setDate(compra.getDate() + 15);
          return venda.getFullYear() === ano && venda.getMonth() === mes;
        }
        return false;
      });
    }

    if (tipo === 'estimado') {
      const dataLabel = this.labelsEstimadoDias[index]; // Ex: "12/07"
      this.dataSelecionada = dataLabel;
      let estimadoDia = 0;

      this.itensSelecionados = this.investimentos.filter(i => {
        if (i.valor_vendido === 0 && i.retornoEstimado) {
          const compra = new Date(i.data_compra);
          const venda = new Date(compra);
          estimadoDia += i.retornoEstimado;
          this.retornoEstimadoDia = estimadoDia;
          venda.setDate(compra.getDate() + 15);
          return format(venda, 'dd/MM') === dataLabel;
        }
        return false;
      });
    }

    this.tipoGraficoSelecionado = tipo;
    this.abrirModal();
  }

  abrirModal() {
    this.modalAberto = true;
    this.toggleBodyScroll(true);
  }

  fecharModal() {
    this.modalAberto = false;
    this.toggleBodyScroll(false);
  }
}
