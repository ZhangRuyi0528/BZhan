import { useState, useEffect, useRef } from 'react';
import type { DanmakuItem } from '../services/types';

function buildPacket(body: string, op: number): ArrayBuffer {
  const bodyBytes = new TextEncoder().encode(body);
  const total = 16 + bodyBytes.length;
  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  view.setUint32(0, total, false);   // total_len
  view.setUint16(4, 16, false);      // header_len
  view.setUint16(6, 0, false);       // ver=0 (no compression)
  view.setUint32(8, op, false);      // op
  view.setUint32(12, 1, false);      // seq
  new Uint8Array(buf).set(bodyBytes, 16);
  return buf;
}

function parsePackets(buf: ArrayBuffer): { op: number; body: string }[] {
  const packets: { op: number; body: string }[] = [];
  let offset = 0;
  const view = new DataView(buf);
  while (offset + 16 <= buf.byteLength) {
    const totalLen = view.getUint32(offset, false);
    const headerLen = view.getUint16(offset + 4, false);
    const op = view.getUint32(offset + 8, false);
    if (totalLen < headerLen || offset + totalLen > buf.byteLength) break;
    const bodyLen = totalLen - headerLen;
    const bodyBytes = new Uint8Array(buf, offset + headerLen, bodyLen);
    const body = new TextDecoder('utf-8').decode(bodyBytes);
    packets.push({ op, body });
    offset += totalLen;
  }
  return packets;
}

export function useLiveDanmaku(roomId: number): DanmakuItem[] {
  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roomId) return;
    setDanmakus([]);

    const ws = new WebSocket('wss://broadcastlv.chat.bilibili.com/sub');
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      const authBody = JSON.stringify({
        roomid: roomId,
        platform: 'web',
        type: 2,
        uid: 0,
        protover: 0,
      });
      ws.send(buildPacket(authBody, 7));

      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(buildPacket('', 2));
        }
      }, 30000);
    };

    ws.onmessage = (e: MessageEvent) => {
      try {
        const packets = parsePackets(e.data as ArrayBuffer);
        for (const pkt of packets) {
          if (pkt.op === 5 && pkt.body) {
            try {
              const msg = JSON.parse(pkt.body);
              if (msg.cmd === 'DANMU_MSG') {
                const info = msg.info;
                const text = info[1] as string;
                const color = (info[3]?.[3] as number) ?? 0xffffff;
                const item: DanmakuItem = { time: 0, mode: 1, fontSize: 25, color, text };
                setDanmakus(prev => [...prev, item]);
              }
            } catch { /* ignore single message parse error */ }
          }
        }
      } catch { /* ignore */ }
    };

    ws.onerror = () => {};
    ws.onclose = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      ws.close();
    };
  }, [roomId]);

  return danmakus;
}
