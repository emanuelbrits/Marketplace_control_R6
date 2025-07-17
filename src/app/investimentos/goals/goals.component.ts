import { Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  selector: 'app-goals',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.css',
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
export class GoalsComponent {
  @Input() investimentos: any[] = [];
  statusMes: string = '';
  mostrarMetas = false;
  mesAtual = format(new Date(), "MMMM yyyy", { locale: ptBR });
  anoAtual = format(new Date(), "yyyy");
  metaMesAtual = { valorObjetivo: 0, valorObtido: 0, progresso: 0 };
  metaAnoAtual = { valorObjetivo: 0, valorObtido: 0, progresso: 0 };
  modalAberto = false;
  tipoMetaModal: 'mes' | 'ano' = 'mes';
  valorMetaEdicao = 0;
  mesSelecionado = format(new Date(), 'MM/yyyy');
  anoSelecionado = format(new Date(), 'yyyy');

  mesesDisponiveis = Array.from({ length: 12 }, (_, i) => {
    const data = new Date();
    data.setMonth(i);
    return {
      value: format(data, 'MM/yyyy'),
      label: format(data, 'MMM yyyy', { locale: ptBR })
    };
  });

  anosDisponiveis = Array.from({ length: 2 }, (_, i) => {
    const ano = new Date().getFullYear() - i;
    return { value: ano.toString(), label: ano.toString() };
  });

  historicoMetas: { tipo: string; periodo: string; valorObjetivo: number, valorObtido: number }[] = [];

  ngOnInit() {
    this.atualizarProgresso();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['investimentos'] && this.investimentos?.length) {
      this.atualizarProgresso();
      this.carregarHistoricoMetas();
    }
  }

  editarMeta(tipo: 'mes' | 'ano') {
    this.tipoMetaModal = tipo;
    this.valorMetaEdicao = tipo === 'mes' ? this.metaMesAtual.valorObjetivo : this.metaAnoAtual.valorObjetivo;
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  async carregarHistoricoMetas() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado.');

      const { data: metas, error } = await supabase
        .from('meta')
        .select('tipo, periodo, valor_objetivo')
        .eq('id_usuario', user.id)
        .order('periodo', { ascending: false });

      if (error) throw error;

      this.historicoMetas = (metas || []).map(meta => ({
        tipo: meta.tipo,
        periodo: meta.periodo,
        valorObjetivo: meta.valor_objetivo,
        valorObtido: this.getLucro(meta.tipo, meta.periodo)
      }));

    } catch (err: any) {
      console.error('Erro ao carregar histórico de metas:', err.message);
    }
  }

  async salvarMeta() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('Usuário não autenticado.');

      const periodo = this.tipoMetaModal === 'mes'
        ? this.mesSelecionado
        : this.anoSelecionado;

      const tipo = this.tipoMetaModal;

      const { data: metaExistente, error: fetchError } = await supabase
        .from('meta')
        .select('*')
        .eq('id_usuario', user.id)
        .eq('tipo', tipo)
        .eq('periodo', periodo)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (metaExistente) {
        const { error: updateError } = await supabase
          .from('meta')
          .update({ valor_objetivo: this.valorMetaEdicao })
          .eq('id', metaExistente.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('meta')
          .insert({
            id_usuario: user.id,
            tipo,
            periodo,
            valor_objetivo: this.valorMetaEdicao
          });

        if (insertError) throw insertError;
      }

      if (tipo === 'mes') {
        this.metaMesAtual.valorObjetivo = this.valorMetaEdicao;
      } else {
        this.metaAnoAtual.valorObjetivo = this.valorMetaEdicao;
      }

      await this.atualizarProgresso();
      this.carregarHistoricoMetas();
      this.fecharModal();

    } catch (err: any) {
      console.error('Erro ao salvar meta:', err.message);
    }
  }

  async atualizarProgresso() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado.');

      // Buscar metas
      const { data: metaMes } = await supabase
        .from('meta')
        .select('valor_objetivo, periodo')
        .eq('id_usuario', user.id)
        .eq('tipo', 'mes')
        .eq('periodo', this.mesSelecionado)
        .maybeSingle();

      const { data: metaAno } = await supabase
        .from('meta')
        .select('valor_objetivo, periodo')
        .eq('id_usuario', user.id)
        .eq('tipo', 'ano')
        .eq('periodo', this.anoSelecionado)
        .maybeSingle();

      const lucroMes = this.getLucro('mes', this.mesSelecionado);
      const lucroAno = this.getLucro('ano', this.anoSelecionado);

      this.metaMesAtual.valorObjetivo = metaMes ? metaMes.valor_objetivo : 0;
      this.metaMesAtual.valorObtido = lucroMes;
      this.metaMesAtual.progresso = this.metaMesAtual.valorObjetivo > 0
        ? Math.min(Math.floor((lucroMes / this.metaMesAtual.valorObjetivo) * 100), 100)
        : 0;

      this.metaAnoAtual.valorObjetivo = metaAno ? metaAno.valor_objetivo : 0;
      this.metaAnoAtual.valorObtido = lucroAno;
      this.metaAnoAtual.progresso = this.metaAnoAtual.valorObjetivo > 0
        ? Math.min(Math.floor((lucroAno / this.metaAnoAtual.valorObjetivo) * 100), 100)
        : 0;

    } catch (err: any) {
      console.error('Erro ao atualizar progresso:', err.message);
    }
  }

  getLucro(tipo: string, periodo: string): number {
    if (periodo) {
      const [mesStr, anoStr] = periodo.split('/');
      const mesSelecionadoNum = parseInt(mesStr, 10) - 1;
      const anoSelecionadoNum = parseInt(anoStr, 10);
      if (tipo === 'mes') {
        // Lucro Mês Selecionado
        const vendidosMes = this.investimentos.filter(i =>
          i.valor_vendido > 0 &&
          i.data_vendaDate.getMonth() === mesSelecionadoNum &&
          i.data_vendaDate.getFullYear() === anoSelecionadoNum
        );

        const lucroMes = vendidosMes.reduce((total, i) => total + (i.valor_vendido * 0.9 - i.valor_compra), 0);
        return lucroMes
      }

      if (tipo === 'ano') {
        // Lucro Ano Selecionado
        const vendidosAno = this.investimentos.filter(i =>
          i.valor_vendido > 0 &&
          i.data_vendaDate.getFullYear() === parseInt(periodo)
        );

        const lucroAno = vendidosAno.reduce((total, i) => total + (i.valor_vendido * 0.9 - i.valor_compra), 0);
        return lucroAno
      }
    }

    return 0
  }

  calcularProgresso(meta: any) {
    return Math.floor(Math.min((meta.valorObtido / meta.valorObjetivo) * 100, 100)) || 0
  }
}

