import { PluginToUiSelectionMessage, UiToPluginMessage } from '../types/plugin';

export function postPluginMessage(message: UiToPluginMessage): void {
  window.parent.postMessage({ pluginMessage: message }, '*');
}

export function notifyEditTabActive(active: boolean): void {
  postPluginMessage({ type: 'edit-tab-active', active });
}

export function applyImageToCanvas(data: Uint8Array): void {
  postPluginMessage({ type: 'create-image', data });
}

export function cancelPlugin(): void {
  postPluginMessage({ type: 'cancel' });
}

export function onSelectionImage(handler: (dataUrl: string) => void): () => void {
  const listener = (event: MessageEvent) => {
    const msg = event.data?.pluginMessage as PluginToUiSelectionMessage | undefined;
    if (msg?.type === 'selection-image') {
      handler(msg.data);
    }
  };

  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
