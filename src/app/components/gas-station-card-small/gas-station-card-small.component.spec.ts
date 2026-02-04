import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { GasStationCardSmallComponent } from './gas-station-card-small.component';

describe('GasStationCardSmallComponent', () => {
  let component: GasStationCardSmallComponent;
  let fixture: ComponentFixture<GasStationCardSmallComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), GasStationCardSmallComponent]
}).compileComponents();

    fixture = TestBed.createComponent(GasStationCardSmallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
