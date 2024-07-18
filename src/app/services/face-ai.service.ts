import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FaceAiService {
  apiKey = '21a3bffecdcd4ae091b63bbf8c1270d8';
  apiEndpoint = 'https://frc.cognitiveservices.azure.com/';
  apiRegion = 'brazilsouth';

  private url = "https://frc.cognitiveservices.azure.com/face/v1.0/detect?returnFaceAttributes=age,gender";

  constructor(
    private http: HttpClient
  ) {

  }

  getPersonAge(imageUrl: string){
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': this.apiKey
    })

    return this.http.post(this.url, {url: this.url}, {headers: headers}).subscribe(res => {
      console.log(res);

    })
  }
}
