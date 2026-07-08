
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';

export const getCurrentAppVersion = async () => {
  const result = await AppUpdate.getAppUpdateInfo();
  // Cap 7 (@capawesome/capacitor-app-update v7) separó version name y code.
  // El consumidor compara numéricamente (+current < +latest), así que es el versionCode.
  return result.currentVersionCode;
};

export const getAvailableAppVersion = async () => {
  const result = await AppUpdate.getAppUpdateInfo();
  return result.availableVersionCode;
};

export const openAppStore = async () => {
  await AppUpdate.openAppStore();
};

export const performImmediateUpdate = async () => {
  const result = await AppUpdate.getAppUpdateInfo();
  if (result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
    return;
  }
  if (result.immediateUpdateAllowed) {
    await AppUpdate.performImmediateUpdate();
  }
};

export const startFlexibleUpdate = async () => {
  const result = await AppUpdate.getAppUpdateInfo();
  if (result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
    return;
  }
  if (result.flexibleUpdateAllowed) {
    await AppUpdate.startFlexibleUpdate();
  }
};

export const completeFlexibleUpdate = async () => {
  await AppUpdate.completeFlexibleUpdate();
};
