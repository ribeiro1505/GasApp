import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HorizontalScrollCardsComponent } from './horizontal-scroll-cards.component';

describe('HorizontalScrollCardsComponent', () => {
  let component: HorizontalScrollCardsComponent;
  let fixture: ComponentFixture<HorizontalScrollCardsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), HorizontalScrollCardsComponent]
}).compileComponents();

    fixture = TestBed.createComponent(HorizontalScrollCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
