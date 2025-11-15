import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecorGalleryComponent } from './decor-gallery.component';

describe('DecorGalleryComponent', () => {
  let component: DecorGalleryComponent;
  let fixture: ComponentFixture<DecorGalleryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecorGalleryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DecorGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
