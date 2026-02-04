import {Component, ElementRef, EventEmitter, Input, Output, ViewChild,} from '@angular/core';
import {GasStation} from 'src/app/services/gas.service';
import {CommonModule} from '@angular/common';
import {GasStationCardSmallComponent} from '../gas-station-card-small/gas-station-card-small.component';
import {IonicModule} from '@ionic/angular';

@Component({
  selector: 'app-horizontal-scroll-cards',
  templateUrl: './horizontal-scroll-cards.component.html',
  styleUrls: ['./horizontal-scroll-cards.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, GasStationCardSmallComponent]
})
export class HorizontalScrollCardsComponent {
  @Input() sectionTitle = '';
  @Input() gasStations: GasStation[] = [];
  @Input() location: [number, number] = [0, 0];
  @Input() showIndicators = true;

  @Output() stationClicked = new EventEmitter<GasStation>();

  @ViewChild('scrollContent', {read: ElementRef})
  scrollContent?: ElementRef;

  canScrollLeft = false;
  canScrollRight = false;
  private scrollListener?: () => void;

  ngAfterViewInit(): void {
    this.checkScrollability();
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    if (this.scrollListener) {
      this.scrollListener();
    }
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByStation(index: number, station: GasStation): any {
    return station.Id || `${station.Nome}-${station.Latitude}-${station.Longitude}`;
  }

  /**
   * Handle station click
   */
  onStationClicked(station: GasStation): void {
    this.stationClicked.emit(station);
  }

  /**
   * Scroll left
   */
  scrollLeft(): void {
    const element = this.getScrollElement();
    if (element) {
      element.scrollBy({
        left: -300,
        behavior: 'smooth',
      });
    }
  }

  /**
   * Scroll right
   */
  scrollRight(): void {
    const element = this.getScrollElement();
    if (element) {
      element.scrollBy({
        left: 300,
        behavior: 'smooth',
      });
    }
  }

  /**
   * Check if scrolling is possible
   */
  private checkScrollability(): void {
    const element = this.getScrollElement();
    if (!element) return;

    this.canScrollLeft = element.scrollLeft > 0;
    this.canScrollRight =
      element.scrollLeft < element.scrollWidth - element.clientWidth;
  }

  /**
   * Setup scroll listener
   */
  private setupScrollListener(): void {
    const element = this.getScrollElement();
    if (!element) return;

    const handleScroll = () => {
      this.checkScrollability();
    };

    element.addEventListener('scroll', handleScroll);
    this.scrollListener = () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }

  /**
   * Get scroll element
   */
  private getScrollElement(): HTMLElement | null {
    if (!this.scrollContent) return null;
    const scrollContent = this.scrollContent.nativeElement.querySelector(
      '.scroll-content'
    );
    return scrollContent as HTMLElement;
  }
}
