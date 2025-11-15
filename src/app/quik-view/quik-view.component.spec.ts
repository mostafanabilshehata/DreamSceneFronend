import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuikViewComponent } from './quik-view.component';

describe('QuikViewComponent', () => {
  let component: QuikViewComponent;
  let fixture: ComponentFixture<QuikViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuikViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuikViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
