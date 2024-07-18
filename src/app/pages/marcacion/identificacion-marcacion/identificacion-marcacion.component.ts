import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { DialogoService } from 'src/app/services/dialogo.service';
import { GeoLocationService } from 'src/app/services/geo-location.service';
import { MainService } from 'src/app/services/main.service';
import { UsuarioService } from 'src/app/services/usuario.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-identificacion-marcacion',
  templateUrl: './identificacion-marcacion.component.html',
  styleUrls: ['./identificacion-marcacion.component.scss']
})
export class IdentificacionMarcacionComponent implements OnInit {
  cantidadImagenes = 3;
  userImageList: string[];

  constructor(
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private mainService: MainService,
    private location: Location,
    private dialog: DialogoService
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((res) => {
      console.log(res);
    });

    setTimeout(async () => {
      (
        await this.usuarioService.getIsUserFaceAuth(
          this.mainService.usuarioActual.id
        )
      ).subscribe(async (res) => {
        if (res != null) {
          console.log(res);
          this.cantidadImagenes = res;
          if (this.cantidadImagenes < 3) {
            (
              await this.usuarioService.onGetUsuarioImages(
                this.mainService.usuarioActual.id,
                'auth'
              )
            ).subscribe((userImageList) => {
              this.userImageList = userImageList;
              this.userImageList.forEach((imageUrl: string) => {
                // Extracting the image name from the URL
                const imageName = imageUrl.split('/').pop(); // This splits the URL by '/' and takes the last segment
                console.log(imageName); // Do what you need with the image name (e.g., store it in an array)
              });
            });
          }
        }
      });
    }, 500);
  }

  onBack() {
    this.location.back();
  }

  async onFileChange(event) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        let base64String: string = reader.result as string;
        // base64String can be used as needed, e.g., sent to a server or displayed in an image tag
        (
          await // base64String can be used as needed, e.g., sent to a server or displayed in an image tag
          this.usuarioService.onSaveUsuarioImage(
            this.mainService.usuarioActual.id,
            'auth',
            base64String
          )
        ).subscribe((res) => {
          console.log(res);
        });
      };
    }
  }

  deleteImage(index: number) {
    // Remove the image from the array based on the index
    this.dialog
      .open('Atención!!', 'Estas seguro que queres eliminar esta imagen?', true)
      .then((res) => {
        if (res?.role == 'aceptar') {
          this.userImageList.splice(index, 1);
        }
      });
  }

  onCargarImagen(){

  }
}
