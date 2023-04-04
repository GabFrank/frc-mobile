import { Injectable } from '@angular/core';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';

@Injectable({
  providedIn: 'root'
})
export class UpdateServiceService {

  constructor() { }

  getCurrentAppVersion = async () => {
    let result = await AppUpdate.getAppUpdateInfo();
    return result.currentVersion;
  };

  getAvailableAppVersion = async () => {
    let result = await AppUpdate.getAppUpdateInfo();
    console.log(result);

    return result.availableVersion;
  };

  openAppStore = async () => {
    await AppUpdate.openAppStore();
  };

  performImmediateUpdate = async () => {
    let result = await AppUpdate.getAppUpdateInfo();
    if (result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
      return;
    }
    if (result.immediateUpdateAllowed) {
      await AppUpdate.performImmediateUpdate();
    }
  };

  startFlexibleUpdate = async () => {
    let result = await AppUpdate.getAppUpdateInfo();
    if (result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
      return;
    }
    if (result.flexibleUpdateAllowed) {
      await AppUpdate.startFlexibleUpdate();
    }
  };

  completeFlexibleUpdate = async () => {
    await AppUpdate.completeFlexibleUpdate();
  };

}
