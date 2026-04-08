import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { token, functionsVersion, appBaseUrl } = appParams;

export const base44 = createClient({
  appId: "69cb07fb94b4627f0bd76151",
  token,
  functionsVersion,
  requiresAuth: false,
  appBaseUrl
});
