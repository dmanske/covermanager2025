/**
 * Serviço para gerenciamento de imagens
 * Responsável por baixar, armazenar e recuperar imagens
 */

// Nome do banco de dados IndexedDB
const DB_NAME = 'MediaImageDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

// Tipos de imagens suportadas
export type ImageType = 'poster' | 'backdrop' | 'season' | 'episode';

// Interface para metadados da imagem
export interface ImageMetadata {
  id: string;          // ID único para a imagem
  mediaId: string;     // ID da série/filme
  type: ImageType;     // Tipo de imagem
  source: 'tmdb' | 'local' | 'custom'; // Origem da imagem
  tmdbPath?: string;   // Caminho no TMDb (se aplicável)
  width?: number;      // Largura da imagem
  height?: number;     // Altura da imagem
  language?: string;   // Idioma da imagem (se aplicável)
  timestamp: number;   // Quando foi salva
}

/**
 * Inicializa o banco de dados IndexedDB para armazenamento de imagens
 */
export const initImageDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Seu navegador não suporta IndexedDB, necessário para armazenamento de imagens.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(new Error('Erro ao abrir banco de dados de imagens.'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Criar object store para imagens
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('mediaId', 'mediaId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('mediaId_type', ['mediaId', 'type'], { unique: false });
      }
    };
  });
};

/**
 * Salva uma imagem no banco de dados IndexedDB
 */
export const saveImage = async (
  mediaId: string, 
  type: ImageType, 
  imageData: string, 
  metadata: Partial<ImageMetadata> = {}
): Promise<string> => {
  try {
    const db = await initImageDatabase();
    const id = `${mediaId}_${type}_${Date.now()}`;
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const imageRecord = {
      id,
      mediaId,
      type,
      data: imageData,
      source: metadata.source || 'tmdb',
      tmdbPath: metadata.tmdbPath,
      width: metadata.width,
      height: metadata.height,
      language: metadata.language,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(imageRecord);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('Erro ao salvar imagem no banco de dados.'));
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    throw error;
  }
};

/**
 * Busca uma imagem pelo ID
 */
export const getImageById = async (id: string): Promise<{ data: string, metadata: ImageMetadata } | null> => {
  try {
    const db = await initImageDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => {
        if (request.result) {
          const { data, ...metadata } = request.result;
          resolve({ data, metadata: metadata as ImageMetadata });
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(new Error('Erro ao buscar imagem.'));
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
    return null;
  }
};

/**
 * Busca imagens por mediaId e tipo
 */
export const getImagesByMedia = async (
  mediaId: string, 
  type?: ImageType
): Promise<Array<{ id: string, metadata: ImageMetadata }>> => {
  try {
    const db = await initImageDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      let request;
      
      if (type) {
        const index = store.index('mediaId_type');
        request = index.getAll([mediaId, type]);
      } else {
        const index = store.index('mediaId');
        request = index.getAll(mediaId);
      }
      
      request.onsuccess = () => {
        const results = request.result.map(item => {
          const { data, ...metadata } = item;
          return { id: item.id, metadata: metadata as ImageMetadata };
        });
        resolve(results);
      };
      
      request.onerror = () => reject(new Error('Erro ao buscar imagens.'));
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao buscar imagens por mídia:', error);
    return [];
  }
};

/**
 * Baixa uma imagem do TMDb e a armazena localmente
 */
export const downloadAndStoreImage = async (
  tmdbPath: string,
  mediaId: string,
  type: ImageType,
  size: 'w92' | 'w154' | 'w185' | 'w300' | 'w500' | 'original' = 'w500'
): Promise<string | null> => {
  try {
    // Verificar se a imagem já existe no banco
    const existingImages = await getImagesByMedia(mediaId, type);
    const existingImage = existingImages.find(img => img.metadata.tmdbPath === tmdbPath);
    
    if (existingImage) {
      return existingImage.id;
    }
    
    // Baixar a imagem do TMDb
    const imageUrl = `https://image.tmdb.org/t/p/${size}${tmdbPath}`;
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Erro ao baixar imagem: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Converter para base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const imageId = await saveImage(mediaId, type, base64data, {
            source: 'tmdb',
            tmdbPath
          });
          
          resolve(imageId);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao converter imagem para base64.'));
    });
  } catch (error) {
    console.error('Erro ao baixar e armazenar imagem:', error);
    return null;
  }
};

/**
 * Converte um arquivo de imagem para base64 e o armazena
 */
export const storeCustomImage = async (
  file: File,
  mediaId: string,
  type: ImageType
): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo não é uma imagem.'));
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onloadend = async () => {
      try {
        const base64data = reader.result as string;
        const imageId = await saveImage(mediaId, type, base64data, {
          source: 'custom',
          width: 0, // Será atualizado posteriormente
          height: 0
        });
        
        // Obter dimensões da imagem
        const img = new Image();
        img.onload = async () => {
          // Atualizar metadados com dimensões
          const db = await initImageDatabase();
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          const getRequest = store.get(imageId);
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              const updatedImage = {
                ...getRequest.result,
                width: img.width,
                height: img.height
              };
              store.put(updatedImage);
            }
          };
          
          transaction.oncomplete = () => {
            db.close();
          };
        };
        
        img.src = base64data;
        resolve(imageId);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
  });
};

/**
 * Deleta uma imagem do banco de dados
 */
export const deleteImage = async (id: string): Promise<boolean> => {
  try {
    const db = await initImageDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Erro ao deletar imagem.'));
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    return false;
  }
};

/**
 * Retorna um URL para a imagem, buscando primeiro no banco local
 * e, se não encontrar, retorna a URL do TMDb
 */
export const getImageUrl = async (
  mediaId: string,
  type: ImageType,
  tmdbPath?: string,
  size: 'w92' | 'w154' | 'w185' | 'w300' | 'w500' | 'original' = 'w500'
): Promise<{ url: string, isLocal: boolean }> => {
  try {
    // Buscar imagens locais para este mediaId e tipo
    const images = await getImagesByMedia(mediaId, type);
    
    // Se encontramos imagens locais, retornar a mais recente
    if (images.length > 0) {
      // Ordenar por timestamp (mais recente primeiro)
      images.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
      
      // Pegar a imagem mais recente
      const mostRecentImage = await getImageById(images[0].id);
      
      if (mostRecentImage) {
        return { url: mostRecentImage.data, isLocal: true };
      }
    }
    
    // Se não encontrou imagem local e temos um caminho do TMDb, retornar URL do TMDb
    if (tmdbPath) {
      return { 
        url: `https://image.tmdb.org/t/p/${size}${tmdbPath}`,
        isLocal: false 
      };
    }
    
    // Se não tiver nada, retornar placeholder
    return { 
      url: `/placeholder.svg?height=450&width=300`,
      isLocal: false 
    };
  } catch (error) {
    console.error('Erro ao buscar URL da imagem:', error);
    
    // Em caso de erro, retornar URL do TMDb ou placeholder
    if (tmdbPath) {
      return { 
        url: `https://image.tmdb.org/t/p/${size}${tmdbPath}`,
        isLocal: false 
      };
    }
    
    return { 
      url: `/placeholder.svg?height=450&width=300`,
      isLocal: false 
    };
  }
}; 