import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { ExploreContainerComponentModule } from '../../explore-container/explore-container.module';
import { HomePageRoutingModule } from './home-routing.module';
import { HorizontalScrollCardsComponent } from 'src/app/components/horizontal-scroll-cards/horizontal-scroll-cards.component';
import { GasStationCardSmallComponent } from 'src/app/components/gas-station-card-small/gas-station-card-small.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    HomePageRoutingModule,
  ],
  declarations: [
    HomePage,
    HorizontalScrollCardsComponent,
    GasStationCardSmallComponent,
  ],
})
export class HomePageModule {}
