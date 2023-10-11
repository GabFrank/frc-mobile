
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';

export const getCurrentAppVersion = async () => {
  const result = await AppUpdate.getAppUpdateInfo();
  return result.currentVersion;
};

export const getAvailableAppVersion = async () => {
  const result = await AppUpdate.getAppUpdateInfo();
  return result.availableVersion;
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
