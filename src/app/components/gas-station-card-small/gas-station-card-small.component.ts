import { Component, Input, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-gas-station-card-small',
  templateUrl: './gas-station-card-small.component.html',
  styleUrls: ['./gas-station-card-small.component.scss'],
})
export class GasStationCardSmallComponent {
  @Input() gasStation: any;
  @Input() location: any;

  gasStations = [
    {
      name: 'galp',
      url: 'https://play-lh.googleusercontent.com/c35iec9F_7Hb2YCKY1wMyxy1kcp8A9JdbGw2v7R2hgOQm4jGxSTKASEt0zgJAxgBgbU',
    },
    {
      name: 'bp',
      url: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/BP_Helios_logo.svg/1200px-BP_Helios_logo.svg.png',
    },
    {
      name: 'prio',
      url: 'https://cdn.cookielaw.org/logos/f3b87880-8639-4d8d-8936-b332ceb16fe9/d45e2d7b-bd89-4f8b-9ecb-24e69a30d35f/4841f480-ee75-4b8b-804a-bd1fa672698a/prio_logo.jpeg',
    },
    {
      name: 'rede energia',
      url: 'https://www.redeenergia.pt/wp-content/themes/understrap-child-master/img/og-thumb-2.png',
    },
    {
      name: 'leclerc',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Logo_E.Leclerc_Sans_le_texte.svg/1200px-Logo_E.Leclerc_Sans_le_texte.svg.png',
    },
    {
      name: 'intermarché',
      url: 'data:image/png;base64,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',
    },
    {
      name: 'auchan',
      url: 'data:image/png;base64,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',
    },
    {
      name: 'cepsa',
      url: 'https://play-lh.googleusercontent.com/LKB7R0mxT48Hhc64pr78kxWKVHU5QPfa4hqa5iO4whm_PFxX9jPwlxDGfVwIPEKGGHE',
    },
    {
      name: 'repsol',
      url: 'http://www.apetro.pt/folder/noticia/imagem/677_Repsol%20Logo.png',
    },
    { name: 'ecobrent', url: 'https://www.ecobrent.com/imagens/logo.png' },
    {
      name: 'shell',
      url: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/Shell_logo.svg/1200px-Shell_logo.svg.png',
    },
    {
      name: 'oz',
      url: 'data:image/png;base64,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',
    },
    {
      name: 'bxpress',
      url: 'data:image/png;base64,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',
    },
    {
      name: 'tfuel',
      url: 'https://s2.coinmarketcap.com/static/img/coins/200x200/3822.png',
    },
  ];

  default_image = 'https://cdn-icons-png.flaticon.com/512/2933/2933839.png';

  constructor(private platform: Platform) {}

  loadLogo(): string {
    return this.checkMarca();
  }

  checkMarca(): string {
    let url;
    if (this.gasStation['Marca']) {
      this.gasStations.forEach((element: any) => {
        if (this.gasStation['Marca'].toLowerCase().includes(element.name)) {
          url = element.url;
        }
      });
    }
    return url || this.checkNome();
  }

  checkNome(): string {
    let url;
    if (this.gasStation['Nome']) {
      this.gasStations.forEach((element: any) => {
        if (this.gasStation['Nome'].toLowerCase().includes(element.name)) {
          url = element.url;
        }
      });
    }
    return url || this.default_image;
  }

  distance(coords1: any[], coords2: any[]) {
    let p = 0.017453292519943295;
    let c = Math.cos;
    let a =
      0.5 -
      c((coords2[0] - coords1[0]) * p) / 2 +
      (c(coords1[0] * p) *
        c(coords2[0] * p) *
        (1 - c((coords2[1] - coords1[1]) * p))) /
        2;

    return (12742 * Math.asin(Math.sqrt(a))).toFixed(2);
  }

  public openMapsApp(location: any) {
    const geocoords = location[0] + ',' + location[1];

    console.log(this.platform.platforms());

    if (
      this.platform.is('ios')
    ) {
      window.open('maps://?q=' + geocoords, '_system');
      return;
    }

    if (this.platform.is('desktop')) {
      window.open('https://www.google.com/maps?q=' + geocoords);
      return;
    }

    window.open('geo:' + geocoords + '?q=' + geocoords, '_system');
  }
}
