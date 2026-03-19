import StaticServer from '@dr.pogodin/react-native-static-server';
import * as FileSystem from 'expo-file-system/legacy';
import * as Network from 'expo-network';

const PORT = 18080;
let server: StaticServer | null = null;

export async function startLanServer(): Promise<string> {
  if (server) await server.stop();
  const root = FileSystem.documentDirectory!.replace('file://', '');
  server = new StaticServer({ fileDir: root, port: PORT, nonLocal: true });
  await server.start();
  const ip = await Network.getIpAddressAsync();
  return `http://${ip}:${PORT}`;
}

export async function stopLanServer(): Promise<void> {
  if (server) {
    await server.stop();
    server = null;
  }
}

export function buildVideoUrl(baseUrl: string, bvid: string, qn: number): string {
  return `${baseUrl}/${bvid}_${qn}.mp4`;
}
