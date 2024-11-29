import api from './api';

export async function generateMap(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/generate-map', formData, {
      responseType: 'text',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate map: ${error.message}`);
    }
    throw new Error('An unexpected error occurred while generating the map');
  }
}