import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { VentaDiaComponent } from './venta-dia/venta-dia.component';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        RouterModule,
        ComponentsModule
    ],
    declarations: [HomeComponent, VentaDiaComponent],
    exports: [HomeComponent, VentaDiaComponent]
})
export class HomeModule { }
