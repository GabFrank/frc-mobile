import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-notificacion',
  templateUrl: './notificacion.component.html',
  styleUrls: ['./notificacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionComponent implements OnInit {
  notifications = [
    {
      id: 1,
      title: 'Your Order Success',
      description: 'Your order has been processed',
      time: '34 minutes ago',
      icon: 'cube',
      color: 'orange'
    },
    {
      id: 2,
      title: 'Payment Successful',
      description: 'Your payment $45 successfully paid',
      time: '2 hours ago',
      icon: 'checkmark',
      color: 'green'
    },
    {
      id: 3,
      title: 'Get Additional Discounts',
      description: 'Get a discount for 3 times delivery',
      time: '4 hours ago',
      icon: 'pricetag',
      color: 'purple'
    },
    {
      id: 4,
      title: 'Your Order Cancelled',
      description: 'Delivery payment has been cancelled',
      time: 'A day ago',
      icon: 'close',
      color: 'red'
    },
    {
      id: 5,
      title: 'Payment Successful',
      description: 'Your payment $45 successfully paid',
      time: '2 days ago',
      icon: 'checkmark',
      color: 'green'
    }
  ];

  constructor() { }

  ngOnInit() { }

  trackById(index: number, item: any): number {
    return item.id;
  }

}
