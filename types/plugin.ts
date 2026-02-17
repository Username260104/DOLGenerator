export type ActiveTab = 'create' | 'edit';

export type UiToPluginMessage =
  | { type: 'edit-tab-active'; active: boolean }
  | { type: 'create-image'; data: Uint8Array }
  | { type: 'cancel' };

export interface PluginToUiSelectionMessage {
  type: 'selection-image';
  data: string;
}
