import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetornoGraficoComponent } from './retorno-grafico.component';

describe('RetornoGraficoComponent', () => {
  let component: RetornoGraficoComponent;
  let fixture: ComponentFixture<RetornoGraficoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetornoGraficoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RetornoGraficoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
