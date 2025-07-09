import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopInvestimentosComponent } from './top-investimentos.component';

describe('TopInvestimentosComponent', () => {
  let component: TopInvestimentosComponent;
  let fixture: ComponentFixture<TopInvestimentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopInvestimentosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopInvestimentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
