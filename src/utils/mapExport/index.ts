import { CommunityMember } from '../../types';
import { MapSettings } from '../../types/mapSettings';
import { generateHtml } from './templates/html';

export interface MapExportOptions extends Partial<MapSettings> {}

export async function exportMap(
  members: CommunityMember[],
  center: [number, number],
  options: MapExportOptions = {}
): Promise<string> {
  const html = await generateHtml(members, center, options);
  return html;
}

export function downloadMap(html: string, filename: string = 'community-map.html'): void {
  // Clean up any potential markdown-style syntax
  const cleanHtml = html
    .replace(/:::\s*{[^}]*}/g, '') // Remove any ::: {#map} style syntax
    .replace(/:::/g, ''); // Remove any remaining colons
    
  const blob = new Blob([cleanHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
