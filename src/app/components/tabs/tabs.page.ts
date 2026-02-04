import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonTabs } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    IonTabs,
  ]
})
export class TabsPage {}
