import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryPillsComponent } from './category-pills';



describe('CategoryPills', () => {
  let component: CategoryPillsComponent;
  let fixture: ComponentFixture<CategoryPillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryPillsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryPillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
