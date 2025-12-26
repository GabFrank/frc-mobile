import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-comentarios',
  templateUrl: './comentarios.component.html',
  styleUrls: ['./comentarios.component.scss'],
})
export class ComentariosComponent implements OnInit {

  recipients = [
    { name: 'breaddog', avatar: 'https://i.pravatar.cc/150?u=breaddog', color: '#ffeb3b' },
    { name: 'graggle', avatar: 'https://i.pravatar.cc/150?u=graggle', color: '#ff4081' },
    { name: 'mallow', avatar: 'https://i.pravatar.cc/150?u=mallow', color: '#e91e63' }
  ];

  otherRecipients = [
    { name: 'phibi', avatar: 'https://i.pravatar.cc/150?u=phibi', color: '#00bcd4' },
    { name: 'wumpus', avatar: 'https://i.pravatar.cc/150?u=wumpus', color: '#3f51b5' }
  ];

  constructor() { }

  ngOnInit() { }

}
