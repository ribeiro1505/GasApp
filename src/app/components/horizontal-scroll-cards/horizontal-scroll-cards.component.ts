import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-horizontal-scroll-cards',
  templateUrl: './horizontal-scroll-cards.component.html',
  styleUrls: ['./horizontal-scroll-cards.component.scss'],
})
export class HorizontalScrollCardsComponent {
  @Input() gasStations: any[] = [];
  @Input() sectionTitle: string = '';
  @Input() location: any[] = [];

  constructor() {}
}
