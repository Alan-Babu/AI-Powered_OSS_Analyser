import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamifiedDebuggerComponent } from './gamified-debugger.component';

describe('GamifiedDebuggerComponent', () => {
  let component: GamifiedDebuggerComponent;
  let fixture: ComponentFixture<GamifiedDebuggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamifiedDebuggerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamifiedDebuggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
