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

  historicoMetas = [
    { tipo: 'mes', periodo: 'jun/2025', bateu: true },
    { tipo: 'ano', periodo: '2024', bateu: false },
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['investimentos'] && this.investimentos?.length) {
      this.atualizarProgresso();
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

  async salvarMeta() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Usuário não autenticado.');
      }

      const periodo = this.tipoMetaModal === 'mes'
        ? format(new Date(), 'MM/yyyy')
        : format(new Date(), 'yyyy');

      const tipo = this.tipoMetaModal;

      // Verificar se já existe meta
      const { data: metaExistente, error: fetchError } = await supabase
        .from('meta')
        .select('*')
        .eq('id_usuario', user.id)
        .eq('tipo', tipo)
        .eq('periodo', periodo)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (metaExistente) {
        // Atualizar
        const { error: updateError } = await supabase
          .from('meta')
          .update({
            valor_objetivo: this.valorMetaEdicao
          })
          .eq('id', metaExistente.id);

        if (updateError) throw updateError;
      } else {
        // Inserir
        const { error: insertError } = await supabase
          .from('meta')
          .insert({
            id_usuario: user.id,
            tipo: tipo,
            periodo: periodo,
            valor_objetivo: this.valorMetaEdicao
          });

        if (insertError) throw insertError;
      }

      // Atualizar localmente
      if (tipo === 'mes') {
        this.metaMesAtual.valorObjetivo = this.valorMetaEdicao;
      } else {
        this.metaAnoAtual.valorObjetivo = this.valorMetaEdicao;
      }

      this.atualizarProgresso();
      this.fecharModal();

    } catch (err: any) {
      console.error('Erro ao salvar meta:', err.message);
      // Se quiser, exiba um toast ou alerta aqui
    }
  }

  async atualizarProgresso() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Usuário não autenticado.');
      }

      const hoje = new Date();
      const periodoMes = format(hoje, 'MM/yyyy');
      const periodoAno = format(hoje, 'yyyy');

      // Buscar meta do mês
      const { data: metaMes, error: mesError } = await supabase
        .from('meta')
        .select('valor_objetivo')
        .eq('id_usuario', user.id)
        .eq('tipo', 'mes')
        .eq('periodo', periodoMes)
        .single();

      // Buscar meta do ano
      const { data: metaAno, error: anoError } = await supabase
        .from('meta')
        .select('valor_objetivo')
        .eq('id_usuario', user.id)
        .eq('tipo', 'ano')
        .eq('periodo', periodoAno)
        .single();

      // Calcular lucro do mês
      const vendidosMes = this.investimentos.filter(i =>
        i.valor_vendido > 0 &&
        i.data_vendaDate.getMonth() === hoje.getMonth() &&
        i.data_vendaDate.getFullYear() === hoje.getFullYear()
      );

      const lucroMes = vendidosMes.reduce((total, i) => total + (i.valor_vendido * 0.9 - i.valor_compra), 0);

      this.metaMesAtual.valorObjetivo = metaMes ? metaMes.valor_objetivo : 0;
      this.metaMesAtual.valorObtido = lucroMes;
      this.metaMesAtual.progresso = this.metaMesAtual.valorObjetivo > 0
        ? Math.min(Math.floor((lucroMes / this.metaMesAtual.valorObjetivo) * 100), 100)
        : 0;

      // Calcular lucro do ano
      const vendidosAno = this.investimentos.filter(i =>
        i.valor_vendido > 0 &&
        i.data_vendaDate.getFullYear() === hoje.getFullYear()
      );

      const lucroAno = vendidosAno.reduce((total, i) => total + (i.valor_vendido * 0.9 - i.valor_compra), 0);

      this.metaAnoAtual.valorObjetivo = metaAno ? metaAno.valor_objetivo : 0;
      this.metaAnoAtual.valorObtido = lucroAno;
      this.metaAnoAtual.progresso = this.metaAnoAtual.valorObjetivo > 0
        ? Math.min(Math.floor((lucroAno / this.metaAnoAtual.valorObjetivo) * 100), 100)
        : 0;

    } catch (err: any) {
      console.error('Erro ao atualizar progresso das metas:', err.message);
      // Pode exibir um toast se quiser
    }
  }
}

